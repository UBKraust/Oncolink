import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DASHBOARD_SECTION_IDS = [
  "minor-alert",
  "kpi-cards",
  "financial-vault",
  "patient-analytics",
  "appointments-invoices",
  "upcoming-compliance",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export interface DashboardLayoutPreferences {
  hiddenSectionIds: DashboardSectionId[];
  sectionOrder: DashboardSectionId[];
}

export const DEFAULT_DASHBOARD_LAYOUT_PREFERENCES: DashboardLayoutPreferences = {
  hiddenSectionIds: [],
  sectionOrder: [...DASHBOARD_SECTION_IDS],
};

function dedupeAndFilterSectionIds(value: unknown): DashboardSectionId[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<DashboardSectionId>();

  for (const entry of value) {
    if (typeof entry === "string" && DASHBOARD_SECTION_IDS.includes(entry as DashboardSectionId)) {
      set.add(entry as DashboardSectionId);
    }
  }

  return [...set];
}

export function normalizeDashboardPreferences(raw?: Partial<DashboardLayoutPreferences> | null): DashboardLayoutPreferences {
  const hiddenSectionIds = dedupeAndFilterSectionIds(raw?.hiddenSectionIds);
  const preferredOrder = dedupeAndFilterSectionIds(raw?.sectionOrder);
  const missingDefaults = DASHBOARD_SECTION_IDS.filter((id) => !preferredOrder.includes(id));

  return {
    hiddenSectionIds,
    sectionOrder: [...preferredOrder, ...missingDefaults],
  };
}

export async function getDashboardLayoutPreferences(): Promise<DashboardLayoutPreferences> {
  if (!isSupabaseConfigured()) return DEFAULT_DASHBOARD_LAYOUT_PREFERENCES;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return DEFAULT_DASHBOARD_LAYOUT_PREFERENCES;

  const { data, error } = await supabase
    .from("dashboard_layout_preferences")
    .select("hidden_section_ids, section_order")
    .eq("therapist_id", userData.user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_DASHBOARD_LAYOUT_PREFERENCES;

  return normalizeDashboardPreferences({
    hiddenSectionIds: data.hidden_section_ids,
    sectionOrder: data.section_order,
  });
}
