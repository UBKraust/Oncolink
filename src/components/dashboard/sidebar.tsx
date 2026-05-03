"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { interactiveState } from "@/components/ui/interactive-state";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-black italic">
          C?
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-black italic tracking-tighter text-primary">Ce&apos;ai Pățit?</span>
          <span className="text-[10px] text-muted-foreground">Cabinet psihoterapie</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {dashboardNavGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <h3 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              {group.title}
            </h3>
            <nav className="space-y-0.5">
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
                      "transition-all duration-150",
                      active
                        ? cn(interactiveState.navItemActive, "shadow-sm")
                        : interactiveState.navItemIdle,
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground/60",
                      )}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
