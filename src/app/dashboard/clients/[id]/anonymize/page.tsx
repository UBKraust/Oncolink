import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { anonymizeClient } from "@/app/dashboard/clients/actions";
import { getClient } from "@/lib/clients/queries";

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
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Deja anonimizat</CardTitle>
            <CardDescription>
              Fișa acestui client a fost deja anonimizată. Acțiunea nu poate fi repetată.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href={`/dashboard/clients/${id}`}>Înapoi la fișă</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const boundAnonymize = anonymizeClient.bind(null, id);
  const errorText = error ? (errorMessages[error] ?? decodeURIComponent(error)) : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la fișă
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Forget Client — GDPR</CardTitle>
              <CardDescription>
                Ireversibil. Șterge numele, emailul, telefonul, CNP/CIF și adresa din
                fișa lui <span className="font-medium">{client.full_name}</span>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

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
      </Card>
    </div>
  );
}
