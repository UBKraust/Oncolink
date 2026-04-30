"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { interactiveState } from "@/components/ui/interactive-state";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black italic">
          C?
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-black italic tracking-tighter text-primary">Ce`ai Pățit?</span>
          <span className="text-xs text-muted-foreground">
            Cabinet psihoterapie
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {dashboardNavGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-2">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === href
                    : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      interactiveState.navItemBase,
                      "transition-all duration-200",
                      active ? cn(interactiveState.navItemActive, "shadow-sm") : interactiveState.navItemIdle,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground/70")} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t p-4 flex flex-col gap-1.5 bg-muted/20">
        <div className="text-xs text-muted-foreground uppercase font-black tracking-widest px-2 mb-1">
          Informații Legale
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 px-2">
          <Link href="/terms" className="text-xs text-slate-600 hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-slate-200">
            Termeni & Condiții
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/privacy" className="text-xs text-slate-600 hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-slate-200">
            GDPR & Confidențialitate
          </Link>
        </div>
        <div className="mt-2 px-2 text-xs text-slate-500 font-semibold uppercase tracking-tight">
          Ce`ai Pățit? v1.2 · GDPR-first workflows
        </div>
      </div>
    </aside>
  );
}
