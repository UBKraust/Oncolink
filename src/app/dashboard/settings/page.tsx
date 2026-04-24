import { SettingsClient } from "@/components/settings/SettingsClient";
import { getTherapistSettings } from "./settings-actions";
import { EMPTY_REMOTE_SETTINGS } from "./settings-defaults";

export default async function SettingsPage() {
  let settings = EMPTY_REMOTE_SETTINGS;
  let loadError: string | null = null;

  try {
    settings = await getTherapistSettings();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca setările cabinetului.";
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setări Cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestionează profilul administrativ, orarul, tarifele și integrările externe.
        </p>
      </div>
      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}
      <SettingsClient settings={settings} />
    </div>
  );
}
