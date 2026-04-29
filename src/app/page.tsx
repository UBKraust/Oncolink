import Link from "next/link";
import { ArrowRight, CalendarRange, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.08),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(241,245,249,0.7))] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">
              ERP clinic privat
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Ce`ai Pățit?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Platformă operațională pentru cabinetul de psihoterapie:
              programări, onboarding, documente legale, evidență clinică și
              fluxuri de conformitate într-o interfață unificată.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl px-6">
                <Link href="/dashboard">
                  Deschide dashboard-ul
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl px-6">
                <Link href="/book">Testează booking-ul public</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4">
            <InfoCard
              icon={ShieldCheck}
              title="Conformitate operațională"
              description="GDPR, exporturi fără PII, contracte și evidență administrativă într-un singur flux."
            />
            <InfoCard
              icon={Lock}
              title="Date clinice protejate"
              description="Note criptate end-to-end și separare clară între operațiunile cabinetului și partea publică."
            />
            <InfoCard
              icon={CalendarRange}
              title="Flux zilnic clar"
              description="Programări, calendar, facturi, cheltuieli și documente gândite ca un sistem coerent, nu ca module izolate."
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/85 p-6 shadow-sm backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-black tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
