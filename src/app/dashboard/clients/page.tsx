import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Plus, ShieldCheck, ShieldOff, UserX, Building, Baby, MapPin } from "lucide-react";
import { CrisisNoteButton } from "@/components/clients/CrisisNoteButton";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listClients } from "@/lib/clients/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { initialsFromName } from "@/lib/clients/validation";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listClients();
  const configured = isSupabaseConfigured();

  const filtered = q
    ? clients.filter((c) => {
        const needle = q.toLowerCase();
        return (
          c.full_name?.toLowerCase().includes(needle) ||
          c.email?.toLowerCase().includes(needle) ||
          c.phone?.toLowerCase().includes(needle) ||
          c.cnp_cif?.toLowerCase().includes(needle)
        );
      })
    : clients;

  const activeCount = clients.filter((c) => !c.notes_anonymized_at).length;
  const anonCount = clients.length - activeCount;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clienți</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} activi · {anonCount} anonimizați · total {clients.length}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/new">
            <Plus className="h-4 w-4" />
            Client nou
          </Link>
        </Button>
      </div>

      {!configured ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo: afișez date de mostră. Configurează Supabase pentru persistență.
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Fișele clienților</CardTitle>
            <CardDescription>Date personale, CNP/CIF, consimțământ GDPR.</CardDescription>
          </div>
          <form className="w-full sm:w-72">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Caută nume, email, CNP…"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Niciun client găsit.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>CNP / CIF</TableHead>
                  <TableHead>GDPR</TableHead>
                  <TableHead>Înregistrat</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const anonymized = Boolean(c.notes_anonymized_at);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {initialsFromName(c.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {c.full_name ?? "—"}
                            </p>
                            {anonymized ? (
                              <p className="text-[11px] text-muted-foreground">
                                anonimizat la {format(new Date(c.notes_anonymized_at!), "d MMM yyyy", { locale: ro })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {anonymized ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <UserX className="h-3 w-3" />
                            Redacted
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="truncate">{c.email ?? "—"}</span>
                            <span className="text-xs">{c.phone ?? "—"}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {(c as any).is_minor && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Baby className="h-3 w-3" /> Minor
                            </Badge>
                          )}
                          {(c as any).billing_type === "B2B_COMPANY" && (
                            <Badge variant="outline" className="gap-1 text-[10px] bg-slate-50">
                              <Building className="h-3 w-3" /> B2B
                            </Badge>
                          )}
                          {(c as any).location && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" /> 
                              {(c as any).location === "CLINICA" ? "Clinică" : "Cabinet"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.cnp_cif ?? "—"}
                      </TableCell>
                      <TableCell>
                        {c.gdpr_consent_signed ? (
                          <Badge variant="success" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Semnat
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <ShieldOff className="h-3 w-3" />
                            Lipsă
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "d MMM yyyy", { locale: ro })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!anonymized && (
                            <CrisisNoteButton clientId={c.id} clientName={c.full_name ?? "Client"} />
                          )}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/clients/${c.id}`}>Deschide</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
