"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarPlus, ChevronRight, LogOut, Menu, Search, UserRound, X } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { dashboardNavGroups } from "@/components/dashboard/nav-groups";
import { Button } from "@/components/ui/button";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const breadcrumbs = useMemo(() => {
    const base = [{ label: "Dashboard", href: "/dashboard" }];
    const current = navItems.find((item) => item.href !== "/dashboard" && pathname?.startsWith(item.href));
    if (!current) return base;
    return [...base, { label: current.label, href: current.href }];
  }, [navItems, pathname]);

  const filteredNavItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return navItems.slice(0, 8);

    return navItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.groupTitle.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [navItems, searchQuery]);


  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    function handleQuickSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleQuickSearchShortcut);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleQuickSearchShortcut);
    };
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

    const target = filteredNavItems[activeIndex] ?? filteredNavItems[0];
    if (target) {
      router.push(target.href);
      setSearchQuery("");
      setSearchOpen(false);
    }
  }

  const displayName = userEmail?.split("@")[0]?.replace(/[._-]/g, " ") ?? "Terapeut";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <button
        type="button"
        className="interactive-base flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground md:hidden"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-dashboard-nav"
        aria-label={mobileMenuOpen ? "Închide meniul de navigare" : "Deschide meniul de navigare"}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="min-w-0 md:hidden">
        <p className="text-label">Ce`ai Pățit?</p>
        <p className="text-caption">ERP cabinet psihoterapie</p>
      </div>

      <div className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground md:flex">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" /> : null}
            <Link href={crumb.href} className={cn("interactive-base rounded-md px-1.5 py-1", index === breadcrumbs.length - 1 ? "text-foreground" : "hover:text-foreground")}>{crumb.label}</Link>
          </div>
        ))}
      </div>

      <div ref={searchRef} className="relative hidden flex-1 md:block">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            id="dashboard-search"
            type="search"
            value={searchQuery}
            placeholder="Navighează rapid…"
            className="input-compact h-10 w-full rounded-md border border-input bg-background pl-9 pr-16"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setActiveIndex(0);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((value) => Math.min(value + 1, filteredNavItems.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((value) => Math.max(value - 1, 0));
              }
              if (event.key === "Escape") setSearchOpen(false);
            }}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </form>

        {searchOpen ? (
          <div className="absolute left-0 top-12 z-40 w-full max-w-md rounded-2xl border bg-popover p-2 shadow-2xl">
            {filteredNavItems.length > 0 ? filteredNavItems.map(({ href, label, icon: Icon, groupTitle }, index) => {
              const active = index === activeIndex;
              return (
                <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 transition-colors", active ? "bg-primary/10 text-primary" : "hover:bg-accent")} onMouseEnter={() => setActiveIndex(index)} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium">{label}</p>
                    <p className="text-caption truncate">{groupTitle}</p>
                  </div>
                </Link>
              );
            }) : <p className="px-3 py-2 text-body-sm text-muted-foreground">Nu am găsit o destinație potrivită.</p>}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <VaultIndicator demoMode={demoMode} />
        <Button asChild size="sm" className="shrink-0">
          <Link href="/dashboard/appointments/new"><CalendarPlus className="h-4 w-4" /><span className="hidden sm:inline">Programare nouă</span><span className="sm:hidden">Nouă</span></Link>
        </Button>
        {userEmail ? <div className="flex items-center gap-2 border-l pl-3"><span className="hidden items-center gap-1.5 text-caption lg:flex"><UserRound className="h-3.5 w-3.5" />{displayName}</span><form action={signOut}><Button type="submit" size="icon" variant="ghost" aria-label="Delogare"><LogOut className="h-4 w-4" /></Button></form></div> : null}
      </div>
    </header>
  );
}
