import { CalendarCheck, CalendarX } from "lucide-react";

export const metadata = { title: "Confirmare programare · Ce`ai Pățit?" };

export default async function ConfirmResultPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; demo?: string }>;
}) {
  const { action, demo } = await searchParams;
  const confirmed = action === "confirm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            confirmed
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {confirmed ? (
            <CalendarCheck className="h-7 w-7" />
          ) : (
            <CalendarX className="h-7 w-7" />
          )}
        </div>
        <h1 className="text-lg font-semibold">
          {confirmed ? "Programare confirmată!" : "Programare anulată"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed
            ? "Mulțumim! Te așteptăm la ședință."
            : "Programarea a fost anulată. Poți face o nouă programare oricând."}
        </p>
        {demo && (
          <p className="mt-4 text-xs text-amber-600">
            Mod demo — statusul nu a fost modificat în baza de date.
          </p>
        )}
        <a
          href="/book"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          {confirmed ? "Înapoi la cabinet" : "Programează o nouă ședință"}
        </a>
      </div>
    </div>
  );
}
