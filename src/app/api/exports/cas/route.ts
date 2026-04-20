// API Route: GET /api/exports/cas?month=2025-04
// Generates a CSV file ready for manual upload to SIUI portal

import { NextRequest, NextResponse } from "next/server";
import { mockCasAppointments } from "@/lib/mock/cas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // e.g. "2025-04"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Parametrul ?month=YYYY-MM este obligatoriu." },
      { status: 400 }
    );
  }

  // Filter sessions for the requested month (mock data)
  const [year, mon] = month.split("-").map(Number);
  const sessions = mockCasAppointments.filter((a) => {
    const d = new Date(a.appointment_date);
    return d.getFullYear() === year && d.getMonth() + 1 === mon;
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
