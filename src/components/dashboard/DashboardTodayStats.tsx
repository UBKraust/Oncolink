import Link from "next/link";
import { AlertTriangle, CalendarCheck, CheckCircle2, ChevronRight, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/app/page-shell";
import type { DashboardAppointment } from "@/lib/mock/dashboard";
import type { TodayFinanceSnapshot } from "@/lib/dashboard/queries";

export function DashboardTodayStats({
  appointments,
  finance,
  alertsCount,
}: {
  appointments: DashboardAppointment[];
  finance: TodayFinanceSnapshot;
  alertsCount: number;
}) {
  const total = appointments.length;
  const confirmedOrDone = appointments.filter(
    (a) => a.status === "CONFIRMAT" || a.status === "FINALIZAT",
  ).length;
  const toIssue = finance.invoicesToIssueCount;

  return (
    <SectionCard title="Ziua în cifre" icon={CalendarCheck}>
      <ul className="divide-y divide-border/60">
        <StatRow
          label="Ședințe azi"
          value={total}
          href="/dashboard/appointments"
        />
        <StatRow
          label="Confirmate / finalizate"
          value={confirmedOrDone}
        />
        <StatRow
          label="Facturi de emis"
          value={toIssue}
          href={toIssue > 0 ? "/dashboard/invoices/new" : undefined}
          highlight={toIssue > 0}
          icon={<Receipt className="h-3.5 w-3.5" />}
        />
        <StatRow
          label="Alerte active"
          value={alertsCount}
          href={alertsCount > 0 ? "/dashboard/compliance" : undefined}
          highlight={alertsCount > 0}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
      </ul>

      <div className="border-t border-border/60 px-6 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/50" />
          <p className="text-xs text-muted-foreground">
            {confirmedOrDone >= total && total > 0
              ? "Toate ședințele de azi sunt confirmate sau finalizate."
              : total === 0
                ? "Nu ai ședințe programate astăzi."
                : `${total - confirmedOrDone} ședințe neconfirmate.`}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function StatRow({
  label,
  value,
  href,
  highlight = false,
  icon,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className={cn("shrink-0", highlight ? "text-destructive" : "text-muted-foreground/50")}>
            {icon}
          </span>
        ) : null}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-2xl font-black tabular-nums leading-none",
            highlight ? "text-destructive" : "text-foreground",
          )}
        >
          {value}
        </span>
        {href ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link href={href} className="block transition-colors hover:bg-muted/30">
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}
