import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";

import { buildMonthlyBillingSummary } from "@/lib/billing/monthly-summary";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = Number.parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
    10,
  );
  const month = Number.parseInt(
    searchParams.get("month") ?? String(new Date().getMonth() + 1),
    10,
  );

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parametrii year/month invalizi." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Configurează Supabase înainte să exporți raportul lunar." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, client_id, appointment_date, duration_minutes, clients(full_name)")
    .gte("appointment_date", startDate)
    .lt("appointment_date", endDate)
    .eq("status", "FINALIZAT")
    .eq("therapist_id", user.id);

  if (appointmentsError) {
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
  }

  const appointmentIds = (appointments ?? []).map((appointment) => appointment.id);
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("appointment_id, amount, status")
    .in("appointment_id", appointmentIds.length ? appointmentIds : ["__none__"])
    .eq("therapist_id", user.id);

  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }

  const summary = buildMonthlyBillingSummary(appointments ?? [], invoices ?? [], year, month);
  const csv = buildMonthlyExportCsv(summary);

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="raport-lunar-${year}-${String(month).padStart(2, "0")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildMonthlyExportCsv(summary: ReturnType<typeof buildMonthlyBillingSummary>) {
  const label = `${MONTHS_RO[summary.month - 1]} ${summary.year}`;
  const lines = [
    `Raport lunar,"${label}"`,
    "",
    "Sumar calculat",
    "Indicator,Valoare",
    `Ședințe finalizate,${summary.totalSessions}`,
    `Ore calculate,${summary.totalHours}`,
    `Total de încasat (RON),${summary.totalAmount}`,
    `Încasat (RON),${summary.collectedAmount}`,
    `Restant (RON),${summary.uncollectedAmount}`,
    "",
    "Detaliu pe clienți",
    "Client,Ședințe,Ore,De încasat (RON),Încasat (RON),Status",
    ...summary.clients.map((client) =>
      [
        csv(client.clientName),
        client.sessions,
        (client.totalMinutes / 60).toFixed(1),
        client.totalAmount,
        client.collectedAmount,
        client.invoiceStatus,
      ].join(","),
    ),
    "",
    "Detaliu pe ședințe",
    "Data,Client,Durată (min),Ore,De încasat (RON),Încasat (RON),Status",
    ...summary.appointments.map((appointment) =>
      [
        csv(format(new Date(appointment.appointmentDate), "dd MMM yyyy HH:mm", { locale: ro })),
        csv(appointment.clientName),
        appointment.durationMinutes,
        (appointment.durationMinutes / 60).toFixed(1),
        appointment.totalAmount,
        appointment.collectedAmount,
        appointment.invoiceStatus,
      ].join(","),
    ),
  ];

  return lines.join("\r\n");
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
