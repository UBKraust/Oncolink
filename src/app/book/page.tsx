import { BookingWidget } from "@/components/booking/booking-widget";
import { PublicPageShell } from "@/components/app/page-shell";

export const metadata = {
  title: "Programare online · Cabinet psihoterapie",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ therapist?: string }>;
}) {
  const { therapist } = await searchParams;

  return (
    <PublicPageShell className="py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="rounded-[2.5rem] border border-border/60 bg-slate-950 px-8 py-10 text-white shadow-xl shadow-slate-200/60 sm:px-10">
            <div className="max-w-xl space-y-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/10 text-xl font-black">
                O
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/60">
                  Programare online
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Rezervă o ședință într-un flux clar și fără telefon înapoi.
                </h1>
                <p className="text-sm/6 text-white/72">
                  Completează datele de bază, alege intervalul disponibil și trimite cererea. Vei primi confirmarea în același flux, fără pași ascunși.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Pas 1</p>
                  <p className="mt-1 text-sm text-white/80">Completezi datele esențiale.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Pas 2</p>
                  <p className="mt-1 text-sm text-white/80">Alegi opțiunea disponibilă.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Pas 3</p>
                  <p className="mt-1 text-sm text-white/80">Primești confirmarea rezervării.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.25rem] border border-border/60 bg-card p-4 shadow-xl shadow-slate-200/40 sm:p-6">
            <div className="mb-5 space-y-1 px-2">
              <h2 className="text-xl font-black tracking-tight">
                Programare online
              </h2>
              <p className="text-sm text-muted-foreground">
                Completează formularul pentru a rezerva o ședință de psihoterapie.
              </p>
            </div>
            <BookingWidget therapistSlug={therapist ?? process.env.NEXT_PUBLIC_PUBLIC_BOOKING_SLUG ?? null} />
          </section>
        </div>
      </div>
    </PublicPageShell>
  );
}
