import { z } from "zod";

import { checkOverlap, OverlapError } from "@/lib/availability/overlapCheck";
import {
  type SupabaseServerDb,
  syncClientLifecycleStatus,
} from "@/lib/clients/lifecycle-sync";
import { pushAppointmentToGoogle } from "@/lib/google/sync";
import { upsertClientByIdentifiers } from "@/lib/clients/upsert";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublicBookingTherapistId } from "@/lib/security/public-booking";
import {
  enforceRateLimit,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/security/public-rate-limit";

export const PublicBookingSchema = z.object({
  full_name: z.string().min(2, "Nume prea scurt"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(7, "Telefon invalid"),
  cnp_cif: z.string().optional(),
  address: z.string().optional(),
  therapist_slug: z.string().optional(),
  website: z.string().optional(),
  slot_start: z.string().datetime({ message: "Data/ora invalidă (format ISO 8601)" }),
  duration_minutes: z.number().int().min(25).max(240).default(50),
});

export type PublicBookingPayload = z.infer<typeof PublicBookingSchema>;

export type PublicBookingResult =
  | {
      ok: true;
      status: 201 | 202;
      body: {
        ok: true;
        appointmentId?: string;
        clientId?: string;
        message?: string;
      };
    }
  | {
      ok: false;
      status: 400 | 401 | 409 | 429 | 500;
      body: { error: string; details?: Record<string, string[] | undefined>; source?: string };
    };

export async function createPublicBooking(
  payload: PublicBookingPayload,
  headers: Headers,
  options?: { rateLimitAction?: string },
): Promise<PublicBookingResult> {
  if (isHoneypotTriggered(payload.website)) {
    return { ok: true, status: 202, body: { ok: true } };
  }

  const rateLimit = await enforceRateLimit({
    action: options?.rateLimitAction ?? "public_booking_submit_v2",
    identifier: `${getClientIp(headers)}:${payload.email.toLowerCase()}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return {
      ok: false,
      status: 429,
      body: { error: "Prea multe încercări. Reîncearcă mai târziu." },
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, status: 500, body: { error: userError.message } };
  }

  const admin = createSupabaseServiceClient();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    therapistId = await resolvePublicBookingTherapistId(payload.therapist_slug);
  }

  if (!therapistId) {
    return {
      ok: false,
      status: 500,
      body: { error: "Nu am găsit niciun terapeut configurat." },
    };
  }

  const db = user ? supabase : admin;

  try {
    await checkOverlap(payload.slot_start, payload.duration_minutes, therapistId);
  } catch (err) {
    if (err instanceof OverlapError) {
      return {
        ok: false,
        status: 409,
        body: {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: err.source,
        },
      };
    }
    throw err;
  }

  let clientId: string;
  try {
    const clientResult = await upsertClientByIdentifiers(
      db as unknown as Parameters<typeof upsertClientByIdentifiers>[0],
      therapistId,
      {
        email: payload.email,
        phone: payload.phone,
        cnp_cif: payload.cnp_cif ?? null,
        full_name: payload.full_name,
      },
      {
        therapist_id: therapistId,
        full_name: payload.full_name,
        email: payload.email.toLowerCase(),
        phone: payload.phone,
        cnp_cif: payload.cnp_cif ?? null,
        address: payload.address ?? null,
      },
    );
    clientId = clientResult.id;
  } catch (clientError) {
    return {
      ok: false,
      status: 500,
      body: {
        error:
          clientError instanceof Error
            ? clientError.message
            : "Nu am putut salva clientul.",
      },
    };
  }

  const { data: appt, error: apptError } = await db
    .from("appointments")
    .insert({
      therapist_id: therapistId,
      client_id: clientId,
      appointment_date: new Date(payload.slot_start).toISOString(),
      duration_minutes: payload.duration_minutes,
      status: "PROGRAMAT",
    })
    .select("id")
    .single();

  if (apptError) {
    if (apptError.code === "23505") {
      return {
        ok: false,
        status: 409,
        body: {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: "race_condition",
        },
      };
    }

    return {
      ok: false,
      status: 500,
      body: { error: apptError.message },
    };
  }

  pushAppointmentToGoogle(appt.id).catch((err) => {
    console.error("[public-booking] Google Calendar sync failed:", err);
  });

  await syncClientLifecycleStatus(db as unknown as SupabaseServerDb, clientId, {
    metadata: { source: "createPublicBooking" },
    reason: "Programare publică creată",
  });

  return {
    ok: true,
    status: 201,
    body: {
      ok: true,
      appointmentId: appt.id,
      clientId,
      message: "Programare confirmată. Veți primi un email de confirmare.",
    },
  };
}
