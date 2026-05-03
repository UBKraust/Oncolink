"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { Button } from "@/components/ui/button";
import { interactiveState } from "@/components/ui/interactive-state";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";
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
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
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

  useOverlayA11y({
    open: mobileMenuOpen,
    onClose: () => setMobileMenuOpen(false),
    containerRef: mobilePanelRef,
    initialFocusRef: mobileCloseButtonRef,
  });

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [firstMatch] = filteredNavItems;
    if (firstMatch) {
      router.push(firstMatch.href);
      setSearchQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground md:hidden"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-dashboard-nav"
        aria-label={mobileMenuOpen ? "Închide meniul de navigare" : "Deschide meniul de navigare"}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile nav overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Închide meniul"
          tabIndex={mobileMenuOpen ? 0 : -1}
        />
        <div
          id="mobile-dashboard-nav"
          ref={mobilePanelRef}
          className={cn(
            "absolute left-4 right-4 top-20 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-3xl border bg-card p-4 shadow-2xl transition-all duration-200",
            mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigație dashboard"
          tabIndex={-1}
        >
            <div className="mb-4 flex items-start justify-between border-b border-border pb-3">
              <div>
                <p className="text-sm font-black text-primary">Ce&apos;ai Pățit?</p>
                <p className="text-xs text-muted-foreground">Navigație rapidă în dashboard</p>
              </div>
              <Button
                ref={mobileCloseButtonRef}
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
                <div key={group.title} className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {group.title}
                  </p>
                  <div className="grid gap-1">
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
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
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

      {/* Mobile logo */}

      <div className="min-w-0 md:hidden">
        <p className="truncate text-sm font-black text-primary">Ce&apos;ai Pățit?</p>
      </div>

      {/* Desktop search */}
      <div ref={searchRef} className="relative hidden flex-1 md:block">
        <form onSubmit={handleSearchSubmit} className="relative max-w-sm">
          <label htmlFor="dashboard-search" className="sr-only">
            Navigare rapidă în dashboard
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="dashboard-search"
            type="search"
            value={searchQuery}
            placeholder="Caută în dashboard…"
            className="h-9 w-full rounded-xl border border-input bg-muted/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
          />
        </form>

        {searchOpen ? (
          <div className="absolute left-0 top-11 z-40 w-full max-w-sm rounded-2xl border bg-popover p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Navigare rapidă
            </p>
            {filteredNavItems.length > 0 ? (
              <div className="grid gap-0.5">
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
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{groupTitle}</p>
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

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        <VaultIndicator demoMode={demoMode} />

        {userEmail ? (
          <div className="flex items-center gap-2 border-l pl-2">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {userEmail}
            </span>
            <form action={signOut}>
              <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" aria-label="Delogare">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
