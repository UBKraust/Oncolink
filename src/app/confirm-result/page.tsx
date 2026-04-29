import { CalendarCheck, CalendarX } from "lucide-react";
import { PublicPageShell } from "@/components/app/page-shell";

export const metadata = { title: "Confirmare programare · Ce`ai Pățit?" };

export default async function ConfirmResultPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; demo?: string }>;
}) {
  const { action, demo } = await searchParams;
  const confirmed = action === "confirm";

  return (
    <PublicPageShell className="flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-xl shadow-slate-200/40">
        <div className={`px-8 py-10 text-white ${
          confirmed ? "bg-emerald-700" : "bg-slate-950"
        }`}>
          <div
            className={`mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] ${
              confirmed
                ? "bg-white/14 text-white"
                : "bg-white/10 text-white"
            }`}
          >
            {confirmed ? (
              <CalendarCheck className="h-8 w-8" />
            ) : (
              <CalendarX className="h-8 w-8" />
            )}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/65">
            Status programare
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            {confirmed ? "Programare confirmată" : "Programare anulată"}
          </h1>
          <p className="mt-3 max-w-xl text-sm/6 text-white/80">
            {confirmed
              ? "Rezervarea a fost confirmată cu succes. Ne vedem la ședință, iar dacă ai nevoie de modificări poți reveni oricând din fluxul de programare."
              : "Programarea a fost anulată. Dacă vrei, poți relua imediat cererea și alege un alt interval disponibil."}
          </p>
        </div>

        <div className="px-8 py-8">
          {demo ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Mod demo: statusul nu a fost modificat în baza de date.
            </div>
          ) : null}

          <a
            href="/book"
            className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            {confirmed ? "Înapoi la cabinet" : "Programează o nouă ședință"}
          </a>
        </div>
      </div>
    </PublicPageShell>
  );
}
