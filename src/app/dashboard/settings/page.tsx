import { SettingsClient } from "@/components/settings/SettingsClient";
import { getTherapistSettings } from "./settings-actions";

export default async function SettingsPage() {
  const settings = await getTherapistSettings();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setări Cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestionează profilul administrativ, orarul, tarifele și integrările externe.
        </p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
