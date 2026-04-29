import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { anonymizeClient } from "@/app/dashboard/clients/actions";
import { getClient } from "@/lib/clients/queries";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

const errorMessages: Record<string, string> = {
  confirmation: "Trebuie să scrii exact „ȘTERGE PII” pentru a confirma.",
  demo: "Mod demo: configurează Supabase pentru a executa anonimizarea.",
};

export default async function AnonymizePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const client = await getClient(id);
  if (!client) notFound();

  if (client.notes_anonymized_at) {
    return (
      <DashboardPage className="max-w-xl">
        <EmptyState
          title="Fișa este deja anonimizată"
          description="Acțiunea a fost deja executată și nu poate fi repetată."
          action={{ label: "Înapoi la fișă", href: `/dashboard/clients/${id}` }}
          icon={UserX}
        />
      </DashboardPage>
    );
  }

  const boundAnonymize = anonymizeClient.bind(null, id);
  const errorText = error ? (errorMessages[error] ?? decodeURIComponent(error)) : null;

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
        title="Forget Client — GDPR"
        description={`Acțiune ireversibilă pentru ${client.full_name}. Elimină datele personale din fișa clientului.`}
      />

      {error === "demo" ? (
        <SetupBanner description="Anonimizarea necesită o conexiune Supabase activă. Fluxul demo a fost eliminat." />
      ) : null}

      <SectionCard
        title="Confirmare anonimizare"
        description="Revizuiește exact ce se păstrează și ce se șterge înainte de a continua."
        icon={AlertTriangle}
      >

        <CardContent className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">Ce se păstrează</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              <li>Istoricul facturilor SmartBill (cerință ANAF).</li>
              <li>Activity logs cu inițialele (registrul CPR).</li>
              <li>Notele clinice criptate sunt șterse împreună cu PII-ul.</li>
            </ul>
          </div>

          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">Ce se șterge definitiv</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              <li>Nume complet, email, telefon, CNP/CIF, adresă.</li>
              <li>URL contract GDPR semnat.</li>
            </ul>
          </div>

          {errorText ? (
            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {errorText}
            </div>
          ) : null}

          <form action={boundAnonymize} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirmation">
                Scrie exact <span className="font-mono">ȘTERGE PII</span> pentru a continua
              </Label>
              <Input
                id="confirmation"
                name="confirmation"
                autoComplete="off"
                required
                placeholder="ȘTERGE PII"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button asChild variant="outline" type="button">
                <Link href={`/dashboard/clients/${id}`}>Anulează</Link>
              </Button>
              <Button type="submit" variant="destructive">
                <UserX className="h-4 w-4" />
                Anonimizează ireversibil
              </Button>
            </div>
          </form>
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
