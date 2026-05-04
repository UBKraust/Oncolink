import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity, ShieldCheck } from "lucide-react";

import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAppointments } from "@/lib/appointments/queries";
import { initialsFromName } from "@/lib/clients/validation";
import { ActivityExportButton } from "@/components/activity/export-button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SectionCard,
  SetupBanner,
} from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditCategory, AuditSeverity } from "@/lib/audit/types";

type AuditRow = {
  id: string;
  action: string;
  category: string;
  severity: string;
  status: string;
  entity_type: string | null;
  entity_id: string | null;
  client_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const SEVERITY_CLASS: Record<AuditSeverity, string> = {
  INFO: "bg-muted text-muted-foreground border-transparent",
  WARNING: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
  CRITICAL: "bg-red-100 text-red-800 border-transparent dark:bg-red-900/30 dark:text-red-400",
};

const CATEGORY_LABELS: Partial<Record<AuditCategory, string>> = {
  CLIENT: "Client",
  NOTE: "Notă",
  DOCUMENT: "Document",
  CONTRACT: "Contract",
  CONSENT: "Consimțământ",
  INVOICE: "Factură",
  APPOINTMENT: "Programare",
  SETTINGS: "Setări",
  SECURITY: "Securitate",
  AI: "AI",
  AUTH: "Autentificare",
  EXPORT: "Export",
  DELETE: "Ștergere",
  REPORT: "Raport",
  ASSESSMENT: "Evaluare",
  SYSTEM: "Sistem",
};

function safeMetaSummary(metadata: Record<string, unknown>): string {
  const SAFE_KEYS = new Set([
    "contract_number", "template_type", "document_type", "file_name",
    "amount", "smartbill_id", "appointment_id", "is_minor",
    "location", "service_type", "source", "expires_at",
    "stored_in_drive", "stored_in_storage", "model", "local",
    "is_draft", "encrypted",
  ]);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(metadata)) {
    if (!SAFE_KEYS.has(k)) continue;
    parts.push(`${k}: ${String(v)}`);
    if (parts.length >= 3) break;
  }
  return parts.join(" · ") || "";
}

async function getAuditLogs(params: {
  category?: string;
  severity?: string;
  clientId?: string;
}): Promise<AuditRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("audit_logs")
    .select("id, action, category, severity, status, entity_type, entity_id, client_id, metadata, created_at")
    .eq("therapist_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.category) query = query.eq("category", params.category);
  if (params.severity) query = query.eq("severity", params.severity);
  if (params.clientId) query = query.eq("client_id", params.clientId);

  const { data } = await query;
  return (data ?? []) as AuditRow[];
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    severity?: string;
    clientId?: string;
  }>;
}) {
  const { from, to, category, severity, clientId } = await searchParams;
  const configured = isSupabaseConfigured();

  const [appointments, auditLogs] = await Promise.all([
    listAppointments({ status: "FINALIZAT", from, to }),
    getAuditLogs({ category, severity, clientId }),
  ]);

  const hasAuditFilters = !!(category || severity || clientId);
  const auditFilterParams = new URLSearchParams();
  if (from) auditFilterParams.set("from", from);
  if (to) auditFilterParams.set("to", to);

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Registru activitate"
        description={`Export CPR · ${appointments.length} ședințe finalizate · fără PII`}
        action={<ActivityExportButton from={from} to={to} />}
      />

      {!configured && (
        <SetupBanner description="Exportul de activitate va deveni disponibil după configurarea Supabase. Datele demo au fost eliminate." />
      )}

      {/* CPR date range filter */}
      <form className="flex flex-wrap items-end gap-3 rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">De la</label>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Până la</label>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Button type="submit" variant="outline">Aplică filtru</Button>
        {(from || to) && (
          <a
            href="/dashboard/activity"
            className="flex h-11 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Resetează
          </a>
        )}
      </form>

      {/* CPR section */}
      <SectionCard
        title="Ședințe finalizate"
        description="Coloanele exportate: data, inițiale client, tip serviciu, durată și locație."
        icon={Activity}
      >
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <EmptyState
              title="Nu există ședințe finalizate în intervalul selectat"
              description="Ajustează perioada sau finalizează programări pentru a genera registrul CPR."
              icon={Activity}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Inițiale</TableHead>
                  <TableHead>Tip serviciu</TableHead>
                  <TableHead>Durată</TableHead>
                  <TableHead>Locație</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => {
                  const initials = a.client?.full_name
                    ? initialsFromName(a.client.full_name)
                    : "—";
                  const location = a.meet_link
                    ? "Online"
                    : a.is_external_duty
                      ? "Policlinică"
                      : "Cabinet privat";
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm tabular-nums">
                        {format(new Date(a.appointment_date), "d MMM yyyy · HH:mm", {
                          locale: ro,
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {initials}
                      </TableCell>
                      <TableCell className="text-sm">
                        Psihoterapie individuală
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.duration_minutes} min
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {location}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>

      {/* Audit log section */}
      <SectionCard
        title="Jurnal audit"
        description="Ultimele 100 de acțiuni înregistrate. Nu conține date clinice brute."
        icon={ShieldCheck}
      >
        {/* Audit filters */}
        <form className="flex flex-wrap items-end gap-3 border-b border-border/60 px-4 pb-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Categorie</label>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Toate</option>
              {(Object.entries(CATEGORY_LABELS) as [AuditCategory, string][]).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Severitate</label>
            <select
              name="severity"
              defaultValue={severity ?? ""}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Toate</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          {from && <input type="hidden" name="from" value={from} />}
          {to && <input type="hidden" name="to" value={to} />}
          <Button type="submit" variant="outline" size="sm">Filtrează</Button>
          {hasAuditFilters && (
            <a
              href={`/dashboard/activity?${auditFilterParams.toString()}`}
              className="flex h-9 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Resetează
            </a>
          )}
        </form>

        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <EmptyState
              title="Nu există înregistrări de audit"
              description={hasAuditFilters ? "Nicio acțiune găsită pentru filtrele selectate." : "Acțiunile vor apărea aici pe măsură ce sunt efectuate."}
              icon={ShieldCheck}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Ora</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Acțiune</TableHead>
                  <TableHead>Severitate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Detalii</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => {
                  const sev = (log.severity as AuditSeverity) ?? "INFO";
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {format(new Date(log.created_at), "d MMM · HH:mm", { locale: ro })}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">
                          {CATEGORY_LABELS[log.category as AuditCategory] ?? log.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.action}
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_CLASS[sev]}>
                          {sev}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={log.status === "SUCCESS" ? "text-xs text-emerald-600 dark:text-emerald-400" : "text-xs text-red-600 dark:text-red-400"}>
                          {log.status === "SUCCESS" ? "✓" : "✗"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground lg:table-cell">
                        {safeMetaSummary(log.metadata ?? {})}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
