export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldOff,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClient } from "@/lib/clients/queries";
import { initialsFromName } from "@/lib/clients/validation";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anonymized?: string }>;
}) {
  const { id } = await params;
  const { anonymized: justAnonymized } = await searchParams;
  const client = await getClient(id);
  if (!client) notFound();

  const anonymized = Boolean(client.notes_anonymized_at);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      {justAnonymized ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Client anonimizat. Datele personale au fost șterse ireversibil; istoricul
          facturilor rămâne neatins.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initialsFromName(client.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.full_name ?? "—"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Înregistrat la{" "}
              {format(new Date(client.created_at), "d MMMM yyyy", { locale: ro })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!anonymized ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/appointments/new?clientId=${client.id}`}>
                <CalendarPlus className="h-4 w-4" />
                Programare nouă
              </Link>
            </Button>
          ) : null}
          {!anonymized ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Editează
              </Link>
            </Button>
          ) : null}
          {!anonymized ? (
            <Button asChild variant="destructive">
              <Link href={`/dashboard/clients/${client.id}/anonymize`}>
                <UserX className="h-4 w-4" />
                Forget Client
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Date de contact</CardTitle>
            {anonymized ? (
              <CardDescription>
                Fișa a fost anonimizată — datele personale nu mai sunt disponibile.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={client.email} />
            <InfoRow icon={Phone} label="Telefon" value={client.phone} />
            <InfoRow
              label="CNP / CIF"
              value={client.cnp_cif}
              mono
              hint={client.cnp_cif ? `${client.cnp_cif.length} caractere` : undefined}
            />
            <InfoRow icon={MapPin} label="Adresă" value={client.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status GDPR &amp; CPR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {client.gdpr_consent_signed ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Consimțământ semnat
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1">
                  <ShieldOff className="h-3 w-3" />
                  Fără consimțământ
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contract</p>
              {client.contract_url ? (
                <a
                  href={client.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Descarcă PDF
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Nesemnat</p>
              )}
            </div>
            {anonymized ? (
              <div>
                <p className="text-xs text-muted-foreground">Anonimizat la</p>
                <p className="text-sm">
                  {format(new Date(client.notes_anonymized_at!), "d MMMM yyyy HH:mm", { locale: ro })}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  hint,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={mono ? "truncate font-mono text-sm" : "truncate text-sm"}>
          {value || "—"}
        </p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
