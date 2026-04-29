import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, { icon: string; border: string; bg: string }> = {
  default: { icon: "bg-primary/10 text-primary", border: "border-border/60", bg: "bg-card" },
  success: { icon: "bg-emerald-500/10 text-emerald-600", border: "border-emerald-200/70", bg: "bg-card" },
  warning: { icon: "bg-amber-500/10 text-amber-700", border: "border-amber-200/70", bg: "bg-card" },
  danger:  { icon: "bg-rose-500/10 text-rose-600", border: "border-rose-200/70", bg: "bg-card" },
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  const s = toneStyles[tone];

  return (
    <div className={cn(
      "flex items-center justify-between rounded-[1.75rem] border p-5 shadow-sm transition-shadow hover:shadow-md",
      s.border, s.bg
    )}>
      <div className="space-y-1 min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="text-2xl font-black tracking-tight text-foreground tabular-nums">{value}</p>
        {hint && <p className="truncate text-[11px] font-medium text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", s.icon)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
