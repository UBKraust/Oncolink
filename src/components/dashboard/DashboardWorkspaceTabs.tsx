"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  FolderKanban,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardWorkspace = "focus" | "flow" | "ops";

const DASHBOARD_WORKSPACES: Array<{
  id: DashboardWorkspace;
  label: string;
  title: string;
  description: string;
  icon: typeof CalendarDays;
}> = [
  {
    id: "focus",
    label: "Azi",
    title: "Focusul zilei",
    description: "Următoarea programare și blocajele care cer triere imediată.",
    icon: CalendarDays,
  },
  {
    id: "flow",
    label: "Flux clinic",
    title: "Rezolvare pe flux",
    description: "Service tracks, programări și evaluări în context clinic.",
    icon: FolderKanban,
  },
  {
    id: "ops",
    label: "Operațional",
    title: "Cabinet și batch work",
    description: "Financiar, conformitate, seif și mentenanță de cabinet.",
    icon: Wallet,
  },
];

interface DashboardWorkspaceTabsProps {
  initialWorkspace: DashboardWorkspace;
  actionsToResolve: number;
  flowCount: number;
  batchTasksCount: number;
  focusContent: ReactNode;
  flowContent: ReactNode;
  opsContent: ReactNode;
}

export function DashboardWorkspaceTabs({
  initialWorkspace,
  actionsToResolve,
  flowCount,
  batchTasksCount,
  focusContent,
  flowContent,
  opsContent,
}: DashboardWorkspaceTabsProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<DashboardWorkspace>(initialWorkspace);

  function updateWorkspace(nextWorkspace: DashboardWorkspace) {
    setActiveWorkspace(nextWorkspace);

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (nextWorkspace === "focus") {
      url.searchParams.delete("workspace");
    } else {
      url.searchParams.set("workspace", nextWorkspace);
    }

    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-3">
            <div className="inline-flex rounded-[1.25rem] border border-border/60 bg-muted/40 p-1">
              {DASHBOARD_WORKSPACES.map((workspace) => {
                const Icon = workspace.icon;
                const isActive = activeWorkspace === workspace.id;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => updateWorkspace(workspace.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-bold transition-all",
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    {workspace.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Workspace activ
              </p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {DASHBOARD_WORKSPACES.find((workspace) => workspace.id === activeWorkspace)?.title}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {DASHBOARD_WORKSPACES.find((workspace) => workspace.id === activeWorkspace)?.description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <WorkspaceSummaryCard
              title="Blocaje & risc"
              value={actionsToResolve}
              subtitle="semnale care cer triere"
              icon={ShieldAlert}
              active={activeWorkspace === "focus"}
              tone="warning"
              onClick={() => updateWorkspace("focus")}
            />
            <WorkspaceSummaryCard
              title="Flux clinic"
              value={flowCount}
              subtitle="agenda de azi și fluxurile clinice"
              icon={FolderKanban}
              active={activeWorkspace === "flow"}
              tone="default"
              onClick={() => updateWorkspace("flow")}
            />
            <WorkspaceSummaryCard
              title="Batch work"
              value={batchTasksCount}
              subtitle="financiar și operațional"
              icon={Wallet}
              active={activeWorkspace === "ops"}
              tone="success"
              onClick={() => updateWorkspace("ops")}
            />
          </div>
        </div>
      </section>

      {activeWorkspace === "focus" ? focusContent : null}
      {activeWorkspace === "flow" ? flowContent : null}
      {activeWorkspace === "ops" ? opsContent : null}
    </>
  );
}

function WorkspaceSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  active,
  tone,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof ShieldAlert;
  active: boolean;
  tone: "default" | "warning" | "success";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.5rem] border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
        active
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-border/60 bg-muted/20 hover:border-primary/20",
      )}
      aria-pressed={active}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "warning" && "text-amber-600",
            tone === "success" && "text-emerald-600",
            tone === "default" && "text-primary",
          )}
        />
        {title}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </button>
  );
}
