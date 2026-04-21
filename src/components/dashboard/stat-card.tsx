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
  default: { icon: "bg-blue-50 text-blue-600",   border: "border-slate-100", bg: "bg-white" },
  success: { icon: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", bg: "bg-white" },
  warning: { icon: "bg-amber-50 text-amber-600",  border: "border-amber-100",  bg: "bg-white" },
  danger:  { icon: "bg-rose-50 text-rose-600",    border: "border-rose-100",   bg: "bg-white" },
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  const s = toneStyles[tone];

  return (
    <div className={cn(
      "flex items-center justify-between rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md",
      s.border, s.bg
    )}>
      <div className="space-y-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
        {hint && <p className="text-[11px] text-slate-400 font-medium italic truncate">{hint}</p>}
      </div>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", s.icon)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
