"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarPlus, LogOut, Menu, Search, X } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { Button } from "@/components/ui/button";
import { interactiveState } from "@/components/ui/interactive-state";
import { cn } from "@/lib/utils";
import { VaultIndicator } from "@/components/notes/vault-indicator";

interface DashboardTopbarProps {
  userEmail: string | null;
  demoMode: boolean;
}

export function DashboardTopbar({ userEmail, demoMode }: DashboardTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = useMemo(
    () =>
      dashboardNavGroups.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          groupTitle: group.title,
        })),
      ),
    [],
  );

  const filteredNavItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return navItems.slice(0, 6);

    return navItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.groupTitle.toLowerCase().includes(normalized),
      )
      .slice(0, 6);
  }, [navItems, searchQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const [firstMatch] = filteredNavItems;
    if (firstMatch) {
      router.push(firstMatch.href);
      setSearchQuery("");
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <button
        type="button"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground md:hidden"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-dashboard-nav"
        aria-label={mobileMenuOpen ? "Închide meniul de navigare" : "Deschide meniul de navigare"}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" aria-hidden={!mobileMenuOpen}>
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Închide meniul"
          />

          <div
            id="mobile-dashboard-nav"
            className="absolute left-4 right-4 top-20 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-3xl border bg-card p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigație dashboard"
          >
            <div className="mb-4 flex items-start justify-between border-b border-border pb-3">
              <div>
                <p className="text-sm font-black text-primary">Ce`ai Pățit?</p>
                <p className="text-xs text-muted-foreground">Navigație rapidă în dashboard</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Închide navigația"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-4">
              {dashboardNavGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">
                    {group.title}
                  </p>
                  <div className="grid gap-1.5">
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
                            active ? interactiveState.navItemActive : interactiveState.navItemIdle,
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 md:hidden">
        <p className="truncate text-sm font-black text-primary">Ce`ai Pățit?</p>
        <p className="truncate text-xs text-muted-foreground">ERP cabinet psihoterapie</p>
      </div>

      <div ref={searchRef} className="relative hidden flex-1 md:block">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <label htmlFor="dashboard-search" className="sr-only">
            Navigare rapidă în dashboard
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="dashboard-search"
            type="search"
            value={searchQuery}
            placeholder="Navighează către programări, clienți, facturi…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
          />
        </form>

        {searchOpen ? (
          <div className="absolute left-0 top-12 z-40 w-full max-w-md rounded-2xl border bg-popover p-2 shadow-2xl">
            <p className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/70">
              Navigare rapidă
            </p>
            {filteredNavItems.length > 0 ? (
              <div className="grid gap-1">
                {filteredNavItems.map(({ href, label, icon: Icon, groupTitle }) => {
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
                        active ? interactiveState.navItemActive : interactiveState.navItemIdle,
                      )}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">{groupTitle}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nu am găsit o destinație potrivită.
              </p>
            )}
          </div>
        ) : null}
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
