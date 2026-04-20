export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAvailableSlots } from "@/lib/availability/engine";
import type { AppointmentRow } from "@/lib/appointments/helpers";

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
  const { data } = await supabase
    .from("appointments")
    .select("*")
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

  // Check slot is still free
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
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
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    clientId = existing.id;
    await supabase
      .from("clients")
      .update({ full_name, phone: phone ?? null, cnp_cif: cnp_cif ?? null, address: address ?? null })
      .eq("id", clientId);
  } else {
    const { data: created, error } = await supabase
      .from("clients")
      .insert({ full_name, email, phone: phone ?? null, cnp_cif: cnp_cif ?? null, address: address ?? null })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clientId = created.id;
  }

  const { data: appt, error: apptError } = await supabase
    .from("appointments")
    .insert({
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
