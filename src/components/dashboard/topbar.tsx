import Link from "next/link";
import { CalendarPlus, LogOut, Menu, Search } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { Button } from "@/components/ui/button";
import { VaultIndicator } from "@/components/notes/vault-indicator";

interface DashboardTopbarProps {
  userEmail: string | null;
  demoMode: boolean;
}

export function DashboardTopbar({ userEmail, demoMode }: DashboardTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <details className="relative md:hidden">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-background text-foreground marker:content-none">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Deschide meniul de navigare</span>
        </summary>

        <div className="absolute left-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-card p-4 shadow-2xl">
          <div className="mb-4 border-b border-border pb-3">
            <p className="text-sm font-black text-primary">Ce`ai Pățit?</p>
            <p className="text-xs text-muted-foreground">Navigație rapidă în dashboard</p>
          </div>

          <nav className="space-y-4">
            {dashboardNavGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {group.title}
                </p>
                <div className="grid gap-1.5">
                  {group.items.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </details>

      <div className="min-w-0 md:hidden">
        <p className="truncate text-sm font-black text-primary">Ce`ai Pățit?</p>
        <p className="truncate text-[11px] text-muted-foreground">ERP cabinet psihoterapie</p>
      </div>

      <div className="relative hidden flex-1 md:block">
        <label htmlFor="dashboard-search" className="sr-only">
          Caută client, factură sau programare
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="dashboard-search"
          type="search"
          placeholder="Caută client, factură, programare…"
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <VaultIndicator demoMode={demoMode} />

        <Button asChild size="sm" className="shrink-0">
          <Link href="/dashboard/appointments/new">
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Programare nouă</span>
            <span className="sm:hidden">Nouă</span>
          </Link>
        </Button>

        {userEmail ? (
          <div className="flex items-center gap-2 border-l pl-3">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {userEmail}
            </span>
            <form action={signOut}>
              <Button type="submit" size="icon" variant="ghost" aria-label="Delogare">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
