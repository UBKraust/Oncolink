export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initialsFromName } from "@/lib/clients/validation";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * GET /api/activity/export?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv
 *
 * Returns a CSV (or JSON) of finalized appointments or audit logs.
 * Appointments export only: Data, Inițiale client, Tip serviciu — fără PII.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fmt = searchParams.get("format") ?? "csv";
  const dataset = searchParams.get("dataset") ?? "appointments";
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const clientId = searchParams.get("clientId");

  type Row = { date: string; initials: string; service: string; duration: number; location: string };
  const rows: Row[] = [];
  type AuditRow = {
    timestamp: string;
    category: string;
    action: string;
    severity: string;
    status: string;
    client_id: string | null;
  };
  const auditRows: AuditRow[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (dataset === "audit") {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let auditQuery = (supabase as any)
        .from("audit_logs")
        .select("created_at, category, action, severity, status, client_id")
        .eq("therapist_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (from) auditQuery = auditQuery.gte("created_at", `${from}T00:00:00`);
      if (to) auditQuery = auditQuery.lte("created_at", `${to}T23:59:59`);
      if (category) auditQuery = auditQuery.eq("category", category);
      if (severity) auditQuery = auditQuery.eq("severity", severity);
      if (clientId) auditQuery = auditQuery.eq("client_id", clientId);

      const { data, error } = await auditQuery;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      for (const row of data ?? []) {
        auditRows.push({
          timestamp: new Date(row.created_at).toLocaleString("ro-RO"),
          category: row.category,
          action: row.action,
          severity: row.severity,
          status: row.status,
          client_id: row.client_id ?? null,
        });
      }
    } else {
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
  }

  if (fmt === "json") {
    return NextResponse.json(dataset === "audit" ? { rows: auditRows } : { rows });
  }

  void logAuditEvent({
    action: 'CLIENT_EXPORTED',
    category: 'EXPORT',
    severity: 'CRITICAL',
    metadata: {
      format: fmt,
      dataset,
      rows: dataset === "audit" ? auditRows.length : rows.length,
      from: from ?? null,
      to: to ?? null,
      severity: severity ?? null,
      category: category ?? null,
      client_id: clientId ?? null,
    },
  })

  const header =
    dataset === "audit"
      ? "Timestamp,Categorie,Actiune,Severitate,Status,Client ID\n"
      : "Data,Initiale client,Tip serviciu,Durata (min),Locatie\n";
  const body =
    dataset === "audit"
      ? auditRows
          .map(
            (r) =>
              `"${r.timestamp}","${r.category}","${r.action}","${r.severity}","${r.status}","${r.client_id ?? ""}"`,
          )
          .join("\n")
      : rows
          .map(
            (r) =>
              `${r.date},"${r.initials}","${r.service}",${r.duration},"${r.location}"`,
          )
          .join("\n");

  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dataset === "audit" ? "audit-log" : "registru-activitate"}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
