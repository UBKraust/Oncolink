import { Metadata } from "next";
import { getClientForOnboarding } from "@/app/dashboard/clients/onboarding-actions";
import { ClientOnboardingWizard } from "@/components/onboarding/ClientOnboardingWizard";
import { Heart, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Onboarding Pacient | Ce`ai Pățit?",
  description: "Chestionar inițial pentru pacienții noi ai cabinetului de psihologie.",
};

export default async function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: client, error } = await getClientForOnboarding(id);

  if (error || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-background rounded-3xl border border-rose-100 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black">Link Nevalid</h1>
          <p className="text-sm text-muted-foreground">
            Acest link de înrolare nu mai este activ sau a expirat. Te rugăm să contactezi terapeutul tău pentru un link nou.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-primary/10">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-24">
        {/* Logo/Brand Area */}
        <div className="flex flex-col items-center gap-2 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tighter uppercase">Ce`ai Pățit?</h2>
            <p className="text-[10px] font-bold tracking-widest text-primary/60 uppercase">Management Clinic Digital</p>
          </div>
        </div>

        {/* Wizard Container */}
        <div className="mx-auto max-w-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50 p-6 md:p-12 overflow-hidden animate-in zoom-in-95 duration-700">
          <ClientOnboardingWizard clientId={client.id} clientName={client.full_name || "Client"} />
        </div>

        {/* Privacy Note */}
        <p className="mt-12 text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Datele transmise prin acest formular sunt procesate prin fluxurile de securitate ale platformei Ce`ai Pățit?. Configurarea finală și utilizarea clinică trebuie validate de cabinetul operator.
        </p>
      </div>
    </main>
  );
}
