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
  CreditCard,
  Building,
  Baby,
  Wallet,
  FileText,
  Brain,
  Plus
} from "lucide-react";

import { mockAssessments } from "@/lib/mock/assessments";
import { mockPayments } from "@/lib/mock/payments";
import { mockPatientDocuments, mockMedication } from "@/lib/mock/patientFiles";
import { ClientEvolutionChart } from "@/components/clients/ClientEvolutionChart";
import { ClientDriveDocuments } from "@/components/clients/ClientDriveDocuments";
import { ClientFinancialHistory } from "@/components/clients/ClientFinancialHistory";
import { ClientAiAssistant } from "@/components/clients/ClientAiAssistant";
import { PatientDocuments } from "@/components/clients/PatientDocuments";
import { MedicationTracker } from "@/components/clients/MedicationTracker";

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
  const assessments = mockAssessments.filter(a => a.client_id === id);
  const payments = mockPayments.filter(p => p.client_id === id);

  // Build AI context (no CNP/raw identifiers sent)
  const aiClientContext = {
    name: anonymized ? null : client.full_name,
    isMinor: (client as any).is_minor ?? false,
    parentName: (client as any).parent_name ?? null,
    billingType: (client as any).billing_type ?? null,
    companyName: (client as any).company_name ?? null,
    sessionFrequency: (client as any).session_frequency ?? null,
    sessionPrice: (client as any).session_price ?? null,
    totalSessions: payments.length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    gdprSigned: client.gdpr_consent_signed,
    lastAssessments: assessments.slice(0, 3).map(a => ({
      type: a.assessment_type,
      date: new Date(a.created_at).toLocaleDateString("ro-RO"),
      scores: a.scoring_data,
    })),
  };

  const clientDocs = mockPatientDocuments.filter(d => d.client_id === id);
  const clientMeds = mockMedication.filter(m => m.client_id === id);
  const isMinor = (client as any).is_minor ?? false;

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
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Date de contact</CardTitle>
            {anonymized ? (
              <CardDescription>
                Fișa a fost anonimizată — datele personale nu mai sunt disponibile.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-1">
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

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profil & Facturare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <InfoRow 
                icon={MapPin} 
                label="Locație Consultații" 
                value={(client as any).location === "CLINICA" ? "Clinică" : "Cabinet Particular"} 
              />
              <InfoRow 
                icon={Wallet} 
                label="Preț bază per ședință" 
                value={(client as any).session_price ? `${(client as any).session_price} RON` : "Nespecificat"} 
              />
              {(client as any).is_minor ? (
                <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Baby className="h-4 w-4" /> Pacient Minor
                  </div>
                  <InfoRow label="Părinte / Tutore" value={(client as any).parent_name} />
                  <InfoRow label="Telefon Părinte" value={(client as any).parent_phone} />
                </div>
              ) : null}
              {(client as any).billing_type === "B2B_COMPANY" ? (
                <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Building className="h-4 w-4" /> Decontare B2B
                  </div>
                  <InfoRow label="Companie" value={(client as any).company_name} />
                </div>
              ) : (
                <div className="rounded-md border p-3 bg-muted/20">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Facturare Individuală
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ClientEvolutionChart assessments={assessments} />
        <ClientDriveDocuments 
          documents={[
            {
              id: "d-001",
              file_name: "Adeverință_Medicală.pdf",
              document_type: "ADEVERINTA",
              drive_link: "https://drive.google.com/",
              created_at: new Date().toISOString()
            }
          ].filter(() => client.id === "c-003" || !anonymized)} 
        />
      </div>

      {/* Istoric Financiar */}
      <ClientFinancialHistory payments={payments} clientName={client.full_name ?? "Client"} />

      {/* Asistent AI contextual */}
      {!anonymized && <ClientAiAssistant clientContext={aiClientContext} />}

      {/* Dosar Medical — Documente & Medicație */}
      {!anonymized && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Arhivă Documente</h2>
            <PatientDocuments
              clientId={id}
              isMinor={isMinor}
              documents={clientDocs}
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Medicație</h2>
            <MedicationTracker
              clientId={id}
              clientName={client.full_name ?? "Client"}
              medications={clientMeds}
            />
          </div>
        </div>
      )}

      {/* Evaluări Psihologice Segment */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Evaluări & Scoruri Psihologice</h2>
          {!anonymized ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/assessments/new">
                <Plus className="mr-1 h-4 w-4" />
                Adaugă Evaluare
              </Link>
            </Button>
          ) : null}
        </div>

        {assessments.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            Nu există evaluări înregistrate pentru acest pacient.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map(acc => (
              <Card key={acc.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] uppercase">{acc.assessment_type.replace('_', ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(acc.created_at), "d MMM yyyy", { locale: ro })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {Object.keys(acc.scoring_data).length > 0 && (
                    <div className="rounded bg-muted/30 p-3 text-sm">
                      <div className="font-medium mb-2 flex items-center gap-1.5 border-b pb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        Rezultate Test
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(acc.scoring_data).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <span className="text-muted-foreground capitalize">{k.replace('_', ' ')}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {acc.content_summary && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Concluzie / Sumar</p>
                      <p className="text-sm text-muted-foreground">{acc.content_summary}</p>
                    </div>
                  )}
                </CardContent>
                <div className="mt-auto border-t p-4 text-xs">
                  {acc.sent_to_parent_at ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Trimis Părintelui pe {format(new Date(acc.sent_to_parent_at), "d MMM", { locale: ro })}
                    </span>
                  ) : (client as any).is_minor && (client as any).send_report_to_parent ? (
                    <button className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors">
                      <Mail className="h-3 w-3" /> Generează Email Părinte
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3 w-3" /> Doar intern
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
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
