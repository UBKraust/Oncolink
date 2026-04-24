export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAvailableSlots } from "@/lib/availability/engine";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * GET  /api/book          — returns available slots for the next 14 days
 * POST /api/book          — creates an appointment (status=PROGRAMAT) and
 *                           triggers confirmation flow
 */

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    const slots = getAvailableSlots([], 14);
    return NextResponse.json({ slots: slots.map((s) => ({ start: s.startISO, end: s.endISO })) });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  
  let therapistId: string | null = user?.id || null;

  // Fallback for public: find the first therapist (single-tenant MVP mode)
  if (!therapistId) {
    const { data: first } = await admin
      .from("therapist_settings" as never)
      .select("therapist_id")
      .limit(1)
      .maybeSingle() as { data: { therapist_id: string | null } | null };
    therapistId = first?.therapist_id || null;
  }

  if (!therapistId) {
    return NextResponse.json({ slots: [] });
  }

  const db = user ? supabase : admin;
  const { data } = await db
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
    full_name?: string;
    email?: string;
    phone?: string;
    cnp_cif?: string;
    address?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { slotStart, full_name, email, phone, cnp_cif, address } = body;

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

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    const { data: first } = await admin
      .from("therapist_settings" as never)
      .select("therapist_id")
      .limit(1)
      .maybeSingle() as { data: { therapist_id: string | null } | null };
    therapistId = first?.therapist_id || null;
  }

  if (!therapistId) {
    return NextResponse.json({ error: "Nu am găsit niciun terapeut configurat." }, { status: 500 });
  }

  const db = user ? supabase : admin;

  // Check slot is still free
  const { data: conflicts } = await db
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
  const { data: existing } = await db
    .from("clients")
    .select("id")
    .eq("therapist_id", therapistId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    clientId = existing.id;
    await db
      .from("clients")
      .update({ full_name, phone: phone ?? null, cnp_cif: cnp_cif ?? null, address: address ?? null })
      .eq("id", clientId);
  } else {
    const { data: created, error } = await db
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

  const { data: appt, error: apptError } = await db
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
