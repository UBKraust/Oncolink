import { Metadata } from "next";
import { Activity } from "lucide-react";
import { getClientForOnboardingToken } from "@/app/dashboard/clients/onboarding-actions";
import { MinorOnboardingWizard } from "@/components/onboarding/MinorOnboardingWizard";
import { ShieldCheck, Baby } from "lucide-react";
import { PublicPageShell } from "@/components/app/page-shell";

export const metadata: Metadata = {
  title: "Onboarding Minor | Securitate Juridică | Ce`ai Pățit?",
  description: "Formular de înrolare pentru pacienți minori, cu pași dedicați pentru consimțământ și reprezentare legală.",
};

export default async function MinorOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ therapist?: string; t?: string }>;
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
              ? "Onboarding-ul pentru minori funcționează doar cu un link securizat primit de la terapeut sau cabinet."
              : "Acest link securizat pentru onboarding minor nu mai este activ sau a expirat. Cere un link nou din cabinet."}
          </p>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell className="selection:bg-primary/10">
      {/* Visual Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[10%] h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
         <div className="absolute bottom-[10%] right-[10%] h-96 w-96 rounded-full bg-muted blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Safe Header */}
        <div className="flex flex-col items-center gap-3 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground">Ce`ai Pățit? <span className="text-primary">Legal</span></h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocol de Siguranță Minori</p>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border/70 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-700 md:p-14">
           <div className="mb-10 flex items-center gap-3 border-b pb-6">
              <Baby className="h-6 w-6 text-primary" />
              <div>
                 <h3 className="text-lg font-bold">Înregistrare Pacient Minor</h3>
                 <p className="text-xs text-muted-foreground">Documentația necesară pentru începerea procesului terapeutic.</p>
              </div>
           </div>
           
           <MinorOnboardingWizard
             clientName={client.full_name || "Minor"}
             token={token}
           />
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-12 max-w-md mx-auto text-center space-y-4">
           <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-muted-foreground">
             Fluxuri pentru consimțământ • Date sensibile protejate • Verificare juridică necesară înainte de utilizare clinică
           </p>
           <div className="mx-auto h-px w-12 bg-border" />
           <p className="text-[9px] italic text-muted-foreground">
             Ce`ai Pățit? include instrumente pentru gestionarea documentelor și consimțământului. Configurarea finală trebuie adaptată cadrului juridic aplicabil cabinetului.
           </p>
        </div>
      </div>
    </PublicPageShell>
  );
}
