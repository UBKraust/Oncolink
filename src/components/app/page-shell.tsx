import type { ReactNode } from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6 pb-10", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function SetupBanner({
  title = "Setare necesară",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-amber-950 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black">{title}</p>
          <p className="text-sm text-amber-900/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = AlertTriangle,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void; href?: string };
  icon?: LucideIcon;
}) {
  const button = action?.href ? (
    <Button asChild className="mt-5">
      <a href={action.href}>{action.label}</a>
    </Button>
  ) : action ? (
    <Button className="mt-5" onClick={action.onClick}>
      {action.label}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {button}
    </div>
  );
}

export function PublicPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn(
      "min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.08),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(241,245,249,0.72))] px-4 py-10 sm:px-6 lg:px-8",
      className,
    )}>
      {children}
    </main>
  );
}

export function PublicDocumentShell({
  backHref,
  backLabel,
  icon: Icon,
  title,
  subtitle,
  children,
  accentClassName = "bg-slate-950 text-white",
}: {
  backHref?: string;
  backLabel?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  accentClassName?: string;
}) {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-4xl">
        {backHref && backLabel ? (
          <div className="mb-8">
            <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <a href={backHref}>{backLabel}</a>
            </Button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-xl shadow-slate-200/50">
          <div className={cn("relative overflow-hidden px-8 py-10 sm:px-10", accentClassName)}>
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <Icon className="mb-4 h-11 w-11" />
              <h1 className="text-3xl font-black tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm/6 opacity-80">{subtitle}</p> : null}
            </div>
          </div>
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {children}
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
