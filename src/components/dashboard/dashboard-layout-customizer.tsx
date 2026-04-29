"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, LayoutGrid, RotateCcw } from "lucide-react";

import { resetDashboardLayoutPreferences, saveDashboardLayoutPreferences } from "@/app/dashboard/layout-preferences-actions";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_SECTION_IDS,
  DEFAULT_DASHBOARD_LAYOUT_PREFERENCES,
  type DashboardLayoutPreferences,
  type DashboardSectionId,
} from "@/lib/dashboard/layout-preferences";

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  "minor-alert": "Alertă validare minori",
  "kpi-cards": "KPI Cards",
  "financial-vault": "Financial + Vault",
  "patient-analytics": "Patient Analytics",
  "appointments-invoices": "Appointments + Invoices",
  "upcoming-compliance": "Upcoming + Compliance",
};

export function DashboardLayoutCustomizer({ initialPreferences, demoMode }: { initialPreferences: DashboardLayoutPreferences; demoMode: boolean }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const orderedSections = useMemo(() => preferences.sectionOrder.filter((id) => DASHBOARD_SECTION_IDS.includes(id)), [preferences.sectionOrder]);

  function updateAndSave(next: DashboardLayoutPreferences) {
    setPreferences(next);
    if (demoMode) return;

    startTransition(async () => {
      await saveDashboardLayoutPreferences(next);
    });
  }

  function toggleSection(sectionId: DashboardSectionId) {
    const hidden = new Set(preferences.hiddenSectionIds);
    if (hidden.has(sectionId)) hidden.delete(sectionId);
    else hidden.add(sectionId);

    updateAndSave({ ...preferences, hiddenSectionIds: [...hidden] });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedSections.length) return;

    const nextOrder = [...orderedSections];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);

    updateAndSave({ ...preferences, sectionOrder: nextOrder });
  }

  function resetDefaults() {
    const defaults = { ...DEFAULT_DASHBOARD_LAYOUT_PREFERENCES, sectionOrder: [...DASHBOARD_SECTION_IDS] };
    setPreferences(defaults);

    if (demoMode) return;

    startTransition(async () => {
      await resetDashboardLayoutPreferences();
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
          <LayoutGrid className="h-4 w-4" />
          Customize dashboard
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetDefaults}>
          <RotateCcw className="h-4 w-4" />
          Reset to default layout
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2">
          {orderedSections.map((sectionId, index) => {
            const isHidden = preferences.hiddenSectionIds.includes(sectionId);
            return (
              <div key={sectionId} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={!isHidden} onChange={() => toggleSection(sectionId)} />
                  {SECTION_LABELS[sectionId]}
                </label>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(index, -1)} disabled={index === 0 || isPending}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(index, 1)} disabled={index === orderedSections.length - 1 || isPending}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {demoMode ? <p className="text-xs text-muted-foreground">Demo mode: preferințele se aplică local pentru sesiunea curentă.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
