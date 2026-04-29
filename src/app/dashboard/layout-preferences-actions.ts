"use server";

import { revalidatePath } from "next/cache";

import {
  DASHBOARD_SECTION_IDS,
  DEFAULT_DASHBOARD_LAYOUT_PREFERENCES,
  normalizeDashboardPreferences,
  type DashboardLayoutPreferences,
} from "@/lib/dashboard/layout-preferences";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveDashboardLayoutPreferences(
  prefs: DashboardLayoutPreferences,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: "Unauthorized" };

  const normalized = normalizeDashboardPreferences(prefs);

  const { error } = await supabase.from("dashboard_layout_preferences").upsert({
    therapist_id: userData.user.id,
    hidden_section_ids: normalized.hiddenSectionIds,
    section_order: normalized.sectionOrder,
    updated_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function resetDashboardLayoutPreferences(): Promise<{ success: boolean; error?: string }> {
  return saveDashboardLayoutPreferences({
    hiddenSectionIds: DEFAULT_DASHBOARD_LAYOUT_PREFERENCES.hiddenSectionIds,
    sectionOrder: [...DASHBOARD_SECTION_IDS],
  });
}
