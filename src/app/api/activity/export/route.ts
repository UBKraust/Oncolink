export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initialsFromName } from "@/lib/clients/validation";

/**
 * GET /api/activity/export?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv
 *
 * Returns a CSV (or JSON) of finalized appointments.
 * Only exports: Data, Inițiale client, Tip serviciu — fără PII.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fmt = searchParams.get("format") ?? "csv";

  type Row = { date: string; initials: string; service: string; duration: number; location: string };
  const rows: Row[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("appointments")
      .select("appointment_date, duration_minutes, meet_link, is_external_duty, client:clients(full_name)")
      .eq("status", "FINALIZAT")
      .order("appointment_date");

    if (from) query = query.gte("appointment_date", from);
    if (to) query = query.lte("appointment_date", to + "T23:59:59");

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const a of data ?? []) {
      const client = Array.isArray(a.client) ? a.client[0] : a.client;
      rows.push({
        date: new Date(a.appointment_date).toLocaleDateString("ro-RO"),
        initials: client?.full_name ? initialsFromName(client.full_name) : "—",
        service: "Psihoterapie individuală",
        duration: a.duration_minutes,
        location: a.meet_link ? "Online" : a.is_external_duty ? "Policlinică" : "Cabinet privat",
      });
    }
  }

  if (fmt === "json") {
    return NextResponse.json({ rows });
  }

  // CSV
  const header = "Data,Initiale client,Tip serviciu,Durata (min),Locatie\n";
  const body = rows
    .map(
      (r) =>
        `${r.date},"${r.initials}","${r.service}",${r.duration},"${r.location}"`,
    )
    .join("\n");

  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registru-activitate-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
