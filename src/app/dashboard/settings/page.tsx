import { SettingsClient } from "@/components/settings/SettingsClient";
import { getTherapistSettings } from "./settings-actions";
import { EMPTY_REMOTE_SETTINGS } from "./settings-defaults";
import { DashboardPage, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { AlertCircle } from "lucide-react";
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
        <SectionCard
          title="Eroare la încărcarea setărilor"
          description="Poți revizui structura paginii, dar datele reale nu au putut fi preluate în această încărcare."
          icon={AlertCircle}
        >
          <div className="px-6 py-5 text-sm text-muted-foreground">{loadError}</div>
        </SectionCard>
      ) : null}
      <SettingsClient settings={settings} />
    </DashboardPage>
  );
}
