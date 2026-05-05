import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, Trash2 } from "lucide-react";

import { hardDeleteClient } from "@/app/dashboard/clients/actions";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClient, getClientDeletionImpact } from "@/lib/clients/queries";

const errorMessages: Record<string, string> = {
  confirmation: "Trebuie să scrii exact „ȘTERGE DEFINITIV” pentru a confirma.",
  blocked: "Fișa nu poate fi ștearsă definitiv pentru că există date care trebuie păstrate.",
};

export default async function DeleteClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [client, impact] = await Promise.all([
    getClient(id),
    getClientDeletionImpact(id),
  ]);

  if (!client) notFound();

  const errorText = error ? (errorMessages[error] ?? decodeURIComponent(error)) : null;
  const boundDelete = hardDeleteClient.bind(null, id);

  return (
    <DashboardPage className="max-w-2xl">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la fișă
      </Link>

      <PageHeader
        title="Ștergere definitivă client"
        description={`Acțiune rezervată pentru lead-uri sau fișe fără obligații legale active: ${client.full_name}.`}
      />

      {!impact.canDelete ? (
        <SetupBanner
          title="Ștergerea este blocată"
          description="Clientul are date care trebuie păstrate. În aceste cazuri folosește anonimizarea GDPR, nu ștergerea definitivă."
        />
      ) : null}

      <SectionCard
        title="Verificare înainte de ștergere"
        description="Ștergerea definitivă elimină fișa și datele conexe din aplicație. Nu se recomandă pentru clienți activi."
        icon={AlertTriangle}
      >
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">Ce va fi verificat</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              <li>{impact.finalizedAppointmentCount} ședințe finalizate</li>
              <li>{impact.invoiceCount} facturi asociate</li>
              <li>{impact.generatedContractCount} contracte generate</li>
              <li>{impact.appointmentCount} programări totale care vor fi eliminate dacă ștergerea este permisă</li>
            </ul>
          </div>

          {impact.blockers.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">Blocaje detectate</p>
              <ul className="mt-1 list-inside list-disc">
                {impact.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              Fișa poate fi ștearsă definitiv. Acțiunea va elimina și documentele din storage-ul Supabase asociate clientului.
            </div>
          )}

          {errorText ? (
            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {errorText}
            </div>
          ) : null}

          {!impact.canDelete ? (
            <EmptyState
              title="Ștergerea definitivă nu este disponibilă"
              description="Păstrează fișa și folosește anonimizarea dacă trebuie să elimini datele cu caracter personal."
              action={{ label: "Deschide anonimizarea", href: `/dashboard/clients/${id}/anonymize` }}
              icon={Trash2}
            />
          ) : (
            <form action={boundDelete} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="confirmation">
                  Scrie exact <span className="font-mono">ȘTERGE DEFINITIV</span> pentru a continua
                </Label>
                <Input
                  id="confirmation"
                  name="confirmation"
                  autoComplete="off"
                  required
                  placeholder="ȘTERGE DEFINITIV"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <Button asChild variant="outline" type="button">
                  <Link href={`/dashboard/clients/${id}`}>Anulează</Link>
                </Button>
                <Button type="submit" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Șterge definitiv
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
