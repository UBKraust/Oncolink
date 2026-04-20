import Link from "next/link";
import { CalendarPlus, LogOut, Search } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { VaultIndicator } from "@/components/notes/vault-indicator";

interface DashboardTopbarProps {
  userEmail: string | null;
  demoMode: boolean;
}

export function DashboardTopbar({ userEmail, demoMode }: DashboardTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="relative hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Caută client, factură, programare…"
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <VaultIndicator demoMode={demoMode} />

        <Button asChild size="sm">
          <Link href="/dashboard/appointments/new">
            <CalendarPlus className="h-4 w-4" />
            Programare nouă
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
