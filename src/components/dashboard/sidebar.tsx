"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BotMessageSquare,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  FileText,
  Hospital,
  LayoutDashboard,
  Lock,
  NotebookPen,
  Receipt,
  Scale,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Programări", icon: CalendarCheck },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clienți", icon: Users },
  { href: "/dashboard/notes", label: "Note clinice", icon: NotebookPen },
  { href: "/dashboard/invoices", label: "Facturi", icon: Receipt },
  { href: "/dashboard/expenses", label: "Cheltuieli", icon: Wallet },
  { href: "/dashboard/billing", label: "Raportare Lună", icon: BarChart3 },
  { href: "/dashboard/review", label: "Sumar Lunar", icon: CalendarRange },
  { href: "/dashboard/cas", label: "Modul CAS", icon: Hospital },
  { href: "/dashboard/documents", label: "Documente", icon: FileText },
  { href: "/dashboard/activity", label: "Registru", icon: Activity },
  { href: "/dashboard/ai", label: "Asistent AI", icon: BotMessageSquare },
  { href: "/dashboard/vault", label: "Seif Cabinet", icon: Lock },
  { href: "/dashboard/compliance", label: "Conformitate", icon: Scale },
  { href: "/dashboard/settings", label: "Setări", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
          O
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Oncolink</span>
          <span className="text-[11px] text-muted-foreground">
            Cabinet psihoterapie
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 flex flex-col gap-1.5">
        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-2 mb-1">
          Informații Legale
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 px-2">
          <Link href="/terms" className="text-[11px] text-slate-500 hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-slate-200">
            Termeni & Condiții
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/privacy" className="text-[11px] text-slate-500 hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-slate-200">
            GDPR & Confidențialitate
          </Link>
        </div>
        <div className="mt-2 px-2 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
          Oncolink v1.2 · CPR Certified
        </div>
      </div>
    </aside>
  );
}
