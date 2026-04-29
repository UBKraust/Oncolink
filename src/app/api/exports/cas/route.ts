// API Route: GET /api/exports/cas?month=2025-04
// Generates a CSV file ready for manual upload to SIUI portal

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // e.g. "2025-04"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Parametrul ?month=YYYY-MM este obligatoriu." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const [year, mon] = month.split("-").map(Number);
  const from = `${month}-01T00:00:00.000Z`;
  const monthEnd = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  const to = monthEnd.toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      duration_minutes,
      diagnosis_code_cim10,
      referral_number,
      referral_date,
      referring_doctor_code,
      clients(full_name, cnp_cif)
    `)
    .eq("is_cas_subsidized", true)
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Exportul CAS nu este disponibil fără date reale configurate." },
      { status: 503 }
    );
  }

  const sessions = (data ?? []).map((appointment) => {
    const clientRelation = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    return {
      id: appointment.id,
      cnp: clientRelation?.cnp_cif ?? "",
      client_name: clientRelation?.full_name ?? "Necunoscut",
      appointment_date: appointment.appointment_date,
      duration_minutes: appointment.duration_minutes ?? 50,
      diagnosis_code_cim10: appointment.diagnosis_code_cim10 ?? "",
      diagnosis_label: "Diagnostic CAS",
      referral_number: appointment.referral_number ?? "",
      referral_date: appointment.referral_date ?? "",
      referring_doctor_code: appointment.referring_doctor_code ?? "",
    };
  });

  if (sessions.length === 0) {
    return NextResponse.json(
      { error: `Nu există ședințe CAS pentru luna ${month}.` },
      { status: 404 }
    );
  }

  // Build CSV content — columns match SIUI manual import format
  const headers = [
    "Nr. crt.",
    "CNP Pacient",
    "Nume Pacient",
    "Data Serviciului",
    "Cod Serviciu",       // Fixed per contract CAS
    "Nr. Servicii",
    "Cod Diagnostic CIM-10",
    "Diagnostic",
    "Nr. Bilet Trimitere",
    "Data Emitere Bilet",
    "Cod Parafă Medic Trimițător",
    "Durata (min)",
  ];

  const rows = sessions.map((s, idx) => [
    String(idx + 1),
    s.cnp,
    s.client_name,
    new Date(s.appointment_date).toLocaleDateString("ro-RO"),
    "RS06",               // Cod serviciu conexe psihologie (tipic CNAS)
    "1",
    s.diagnosis_code_cim10,
    s.diagnosis_label,
    s.referral_number,
    s.referral_date,
    s.referring_doctor_code,
    String(s.duration_minutes),
  ]);

  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );

  const csv = "\uFEFF" + csvLines.join("\r\n"); // BOM for Excel UTF-8

  const filename = `raport_CAS_${month}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
