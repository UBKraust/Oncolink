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
  const { therapist, t } = await searchParams;
  const token = t?.trim() ?? "";
  const missingToken = !token;
  const { data: client, error } = token
    ? await getClientForOnboardingToken(token)
    : { error: "Token lipsă." };

  if (error || !client) {
    return (
      <PublicPageShell className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-background rounded-3xl border border-rose-100 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
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
    <PublicPageShell className="selection:bg-rose-100">
      {/* Visual Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
         <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-amber-200/30 rounded-full blur-3xl text-amber-500" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Safe Header */}
        <div className="flex flex-col items-center gap-3 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-200/50">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-800">Ce`ai Pățit? <span className="text-amber-600">Legal</span></h2>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Protocol de Siguranță Minori</p>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="mx-auto max-w-3xl bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 p-6 md:p-14 animate-in zoom-in-95 duration-700">
           <div className="mb-10 flex items-center gap-3 border-b pb-6">
              <Baby className="h-6 w-6 text-primary" />
              <div>
                 <h3 className="text-lg font-bold">Înregistrare Pacient Minor</h3>
                 <p className="text-xs text-muted-foreground">Documentația necesară pentru începerea procesului terapeutic.</p>
              </div>
           </div>
           
           <MinorOnboardingWizard
             clientName={client.full_name || "Minor"}
             therapistSlug={therapist ?? process.env.NEXT_PUBLIC_PUBLIC_BOOKING_SLUG ?? null}
             token={token}
           />
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-12 max-w-md mx-auto text-center space-y-4">
           <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">
             Fluxuri pentru consimțământ • Date sensibile protejate • Verificare juridică necesară înainte de utilizare clinică
           </p>
           <div className="h-px w-12 bg-slate-200 mx-auto" />
           <p className="text-[9px] text-slate-400 italic">
             Ce`ai Pățit? include instrumente pentru gestionarea documentelor și consimțământului. Configurarea finală trebuie adaptată cadrului juridic aplicabil cabinetului.
           </p>
        </div>
      </div>
    </PublicPageShell>
  );
}
