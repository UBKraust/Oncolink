import { Metadata } from "next";
import { Activity, Heart } from "lucide-react";

import { getClientForOnboardingToken } from "@/app/dashboard/clients/onboarding-actions";
import { ClientOnboardingWizard } from "@/components/onboarding/ClientOnboardingWizard";
import { PublicPageShell } from "@/components/app/page-shell";

export const metadata: Metadata = {
  title: "Onboarding Pacient | Ce`ai Pățit?",
  description: "Chestionar inițial pentru pacienții noi ai cabinetului de psihologie.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = t?.trim() ?? "";
  const missingToken = !token;
  const { data: client, error } = token
    ? await getClientForOnboardingToken(token)
    : { error: "Token lipsă." };

  if (error || !client) {
    return (
      <PublicPageShell className="flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-border/70 bg-card p-8 text-center shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black">
            {missingToken ? "Lipsește linkul personal" : "Link Nevalid"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {missingToken
              ? "Pagina de onboarding pentru adulți funcționează doar cu un link securizat primit de la terapeut. Creează mai întâi clientul în dashboard și generează linkul personalizat de onboarding."
              : "Acest link de înrolare nu mai este activ sau a expirat. Te rugăm să contactezi terapeutul tău pentru un link nou."}
          </p>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell className="selection:bg-primary/10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-3xl opacity-30" />
        <div className="absolute top-[20%] -right-[5%] h-[30%] w-[30%] rounded-full bg-muted blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-24">
        <div className="flex flex-col items-center gap-2 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tighter uppercase">Ce`ai Pățit?</h2>
            <p className="text-[10px] font-bold tracking-widest text-primary/60 uppercase">Management Clinic Digital</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-700 md:p-12">
          <ClientOnboardingWizard token={token} clientName={client.full_name || "Client"} />
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Datele transmise prin acest formular sunt procesate prin fluxurile de securitate ale platformei Ce`ai Pățit?. Configurarea finală și utilizarea clinică trebuie validate de cabinetul operator.
        </p>
      </div>
    </PublicPageShell>
  );
}
