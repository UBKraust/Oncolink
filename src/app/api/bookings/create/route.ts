export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkOverlap, OverlapError } from "@/lib/availability/overlapCheck";
import { pushAppointmentToGoogle } from "@/lib/google/sync";

const BookingSchema = z.object({
  // Client details
  full_name: z.string().min(2, "Nume prea scurt"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(7, "Telefon invalid"),
  cnp_cif: z.string().optional(),
  address: z.string().optional(),
  // Booking details
  slot_start: z.string().datetime({ message: "Data/ora invalidă (format ISO 8601)" }),
  duration_minutes: z.number().int().min(25).max(240).default(50),
});

type BookingPayload = z.infer<typeof BookingSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviciu indisponibil în modul demo." },
      { status: 503 },
    );
  }

  // --- Parse & validate payload ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const payload: BookingPayload = parsed.data;
  const startISO = payload.slot_start;

  // --- Step 1 + 2: Dual overlap check (Supabase + Google FreeBusy) ---
  try {
    await checkOverlap(startISO, payload.duration_minutes);
  } catch (err) {
    if (err instanceof OverlapError) {
      return NextResponse.json(
        {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: err.source,
        },
        { status: 409 },
      );
    }
    throw err;
  }

  const supabase = await createSupabaseServerClient();

  // --- Step 3: Atomic client upsert + appointment insert ---
  // Upsert client (match by email or phone)
  let clientId: string;

  const { data: byEmail } = await supabase
    .from("clients")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();

  const { data: byPhone } = !byEmail
    ? await supabase
        .from("clients")
        .select("id")
        .eq("phone", payload.phone)
        .maybeSingle()
    : { data: null };

  const existingClient = byEmail ?? byPhone;

  if (existingClient) {
    clientId = existingClient.id;
    await supabase
      .from("clients")
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        cnp_cif: payload.cnp_cif ?? null,
        address: payload.address ?? null,
      })
      .eq("id", clientId);
  } else {
    const { data: created, error: clientError } = await supabase
      .from("clients")
      .insert({
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        cnp_cif: payload.cnp_cif ?? null,
        address: payload.address ?? null,
      })
      .select("id")
      .single();

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 });
    }
    clientId = created.id;
  }

  // Insert appointment
  const { data: appt, error: apptError } = await supabase
    .from("appointments")
    .insert({
      client_id: clientId,
      appointment_date: new Date(startISO).toISOString(),
      duration_minutes: payload.duration_minutes,
      status: "PROGRAMAT",
    })
    .select("id")
    .single();

  if (apptError) {
    // Unique constraint violation = race condition, another booking just won
    if (apptError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: "race_condition",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // --- Step 4: Push to Google Calendar (non-blocking — don't fail booking if Google is down) ---
  pushAppointmentToGoogle(appt.id).catch((err) => {
    console.error("[bookings/create] Google Calendar sync failed:", err);
  });

  return NextResponse.json(
    {
      ok: true,
      appointmentId: appt.id,
      clientId,
      message: "Programare confirmată. Veți primi un email de confirmare.",
    },
    { status: 201 },
  );
}
