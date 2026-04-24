export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAvailableSlots } from "@/lib/availability/engine";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolvePublicBookingTherapistId } from "@/lib/security/public-booking";
import {
  enforceRateLimit,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/security/public-rate-limit";

/**
 * GET  /api/book          — returns available slots for the next 14 days
 * POST /api/book          — creates an appointment (status=PROGRAMAT) and
 *                           triggers confirmation flow
 */

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    const slots = getAvailableSlots([], 14);
    return NextResponse.json({ slots: slots.map((s) => ({ start: s.startISO, end: s.endISO })) });
  }

  const rateLimit = await enforceRateLimit({
    action: "public_booking_slots",
    identifier: getClientIp(req.headers),
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Prea multe solicitări." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  
  let therapistId: string | null = user?.id || null;
  const therapistSlug = new URL(req.url).searchParams.get("therapist");
  if (!therapistId) therapistId = await resolvePublicBookingTherapistId(therapistSlug);

  if (!therapistId) {
    return NextResponse.json({ error: "Booking public indisponibil." }, { status: 404 });
  }

  const db = user ? supabase : admin;
  const { data } = await (db as any)
    .from("appointments")
    .select("*")
    .eq("therapist_id", therapistId)
    .gte(
      "appointment_date",
      new Date(Date.now() - 86_400_000).toISOString(),
    )
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  const slots = getAvailableSlots((data ?? []) as AppointmentRow[]);
  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.startISO, end: s.endISO })),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Booking offline în mod demo." }, { status: 503 });
  }

  let body: {
    slotStart?: string;
    therapist_slug?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    cnp_cif?: string;
    address?: string;
    website?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { slotStart, therapist_slug, full_name, email, phone, cnp_cif, address, website } = body;

  if (!slotStart || !full_name || !email) {
    return NextResponse.json(
      { error: "slotStart, full_name, email sunt obligatorii." },
      { status: 400 },
    );
  }

  const start = new Date(slotStart);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "slotStart invalid." }, { status: 400 });
  }

  if (isHoneypotTriggered(website)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const rateLimit = await enforceRateLimit({
    action: "public_booking_submit",
    identifier: `${getClientIp(req.headers)}:${email.toLowerCase()}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă mai târziu." },
      { status: 429 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    therapistId = await resolvePublicBookingTherapistId(therapist_slug);
  }

  if (!therapistId) {
    return NextResponse.json({ error: "Nu am găsit niciun terapeut configurat." }, { status: 500 });
  }

  const db = user ? supabase : admin;

  // Check slot is still free
  const { data: conflicts } = await (db as any)
    .from("appointments")
    .select("id")
    .eq("therapist_id", therapistId)
    .gte("appointment_date", new Date(start.getTime() - 60 * 60_000).toISOString())
    .lte("appointment_date", new Date(start.getTime() + 60 * 60_000).toISOString())
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "Slot indisponibil. Alege un alt interval." },
      { status: 409 },
    );
  }

  // Upsert client
  let clientId: string;
  const { data: existing } = await (db as any)
    .from("clients")
    .select("id")
    .eq("therapist_id", therapistId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    clientId = existing.id;
    await (db as any)
      .from("clients")
      .update({ full_name, phone: phone ?? null, cnp_cif: cnp_cif ?? null, address: address ?? null })
      .eq("id", clientId);
  } else {
    const { data: created, error } = await (db as any)
      .from("clients")
      .insert({ 
        therapist_id: therapistId, 
        full_name, 
        email, 
        phone: phone ?? null, 
        cnp_cif: cnp_cif ?? null, 
        address: address ?? null 
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clientId = created.id;
  }

  const { data: appt, error: apptError } = await (db as any)
    .from("appointments")
    .insert({
      therapist_id: therapistId,
      client_id: clientId,
      appointment_date: start.toISOString(),
      duration_minutes: 50,
      status: "PROGRAMAT",
    })
    .select("id")
    .single();

  if (apptError) return NextResponse.json({ error: apptError.message }, { status: 500 });

  return NextResponse.json({ ok: true, appointmentId: appt.id }, { status: 201 });
}
