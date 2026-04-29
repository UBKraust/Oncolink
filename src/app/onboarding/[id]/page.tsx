import { Metadata } from "next";
import { Activity } from "lucide-react";
import { PublicPageShell } from "@/components/app/page-shell";

export const metadata: Metadata = {
  title: "Onboarding Pacient | Ce`ai Pățit?",
  description: "Chestionar inițial pentru pacienții noi ai cabinetului de psihologie.",
};

export default async function LegacyOnboardingPage() {
  return (
    <PublicPageShell className="flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background rounded-3xl border border-rose-100 shadow-2xl p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
          <Activity className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-black">Link Nevalid</h1>
        <p className="text-sm text-muted-foreground">
          Linkurile vechi de onboarding nu mai sunt acceptate. Te rugăm să contactezi terapeutul pentru un link securizat nou.
        </p>
      </div>
    </PublicPageShell>
  );
}
