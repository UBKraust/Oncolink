import { SettingsClient } from "@/components/settings/SettingsClient";
import { getTherapistSettings } from "./settings-actions";
import { EMPTY_REMOTE_SETTINGS } from "./settings-defaults";
import { DashboardPage, PageHeader, SetupBanner } from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function SettingsPage() {
  const configured = isSupabaseConfigured();
  let settings = EMPTY_REMOTE_SETTINGS;
  let loadError: string | null = null;

  try {
    settings = await getTherapistSettings();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca setările cabinetului.";
  }

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Setări cabinet"
        description="Gestionează profilul administrativ, orarul, tarifele și integrările externe."
      />
      {!configured ? (
        <SetupBanner description="Setările sunt pregătite pentru completare, dar salvarea este dezactivată până când configurezi Supabase." />
      ) : null}
      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}
      <SettingsClient settings={settings} />
    </DashboardPage>
  );
}
