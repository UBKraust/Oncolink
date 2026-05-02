"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isPast, isFuture } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarPlus, CheckCircle2, ChevronLeft, ClipboardList, Mail, Pencil, Phone,
  ShieldOff, Plus, Brain, Wallet, FileText, ArrowRight, Clock,
  Calendar, MapPin, ShieldAlert, Video, RefreshCw, TrendingUp, FileCheck,
  Copy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deriveClientLifecycle } from "@/lib/clients/lifecycle";
import { cn } from "@/lib/utils";
import { ActionCard, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { toast } from "@/components/ui/toast";
import { createClientOnboardingLink } from "@/app/dashboard/clients/onboarding-actions";
import {
  reactivateClientLifecycle,
  transitionClientLifecycle,
} from "@/app/dashboard/clients/actions";

import { ClientEvolutionChart } from "@/components/clients/ClientEvolutionChart";
import { ClientDriveDocuments } from "@/components/clients/ClientDriveDocuments";
import { ClientAiAssistant } from "@/components/clients/ClientAiAssistant";
import { PersonalInfoOverlay } from "@/components/clients/PersonalInfoOverlay";
import { FinancialDetailOverlay } from "@/components/clients/FinancialDetailOverlay";
import { MedicalDetailOverlay } from "@/components/clients/MedicalDetailOverlay";
import { CrisisNotesDetailOverlay } from "@/components/clients/CrisisNotesDetailOverlay";
import { AssessmentDetailOverlay } from "@/components/clients/AssessmentDetailOverlay";
import { ContractGeneratorModal } from "@/components/clients/ContractGeneratorModal";
import { ServiceTrackCard } from "@/components/clients/ServiceTrackCard";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_BADGE_VARIANTS,
  isServiceType,
} from "@/lib/clients/service-track";
import type {
  ClientAiContext,
  ClientAppointment,
  ClientAssessment,
  ClientDocument,
  ClientMedication,
  ClientPayment,
  ClientProfile,
  ClientStatusHistoryItem,
  CrisisNoteItem,
  WidgetCardProps,
} from "@/components/clients/types";

interface ClientDashboardUIProps {
  client: ClientProfile;
  assessments: ClientAssessment[];
  payments: ClientPayment[];
  clientDocs: ClientDocument[];
  clientMeds: ClientMedication[];
  crisisNotes: CrisisNoteItem[];
  appointments: ClientAppointment[];
  lifecycleHistory: ClientStatusHistoryItem[];
  anonymized: boolean;
  justAnonymized: boolean;
  sectionParam: string | undefined;
  assessmentParam: string | undefined;
  aiClientContext: ClientAiContext;
}

const SESSION_FREQ_LABELS: Record<string, string> = {
  SAPTAMANAL: "Săptămânal",
  BILUNAR: "Bilunar",
  LUNAR: "Lunar",
  OCAZIONAL: "Ocazional",
};

const STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  ONBOARDING: "Onboarding",
  PROGRAMAT: "Programat",
  ACTIV: "Activ",
  INACTIV: "Inactiv",
  INCHEIAT: "Încheiat",
  NECONVERSIE: "Neconversie",
  ANONIMIZAT: "Anonimizat",
};

export function ClientDashboardUI({
  client,
  assessments,
  payments,
  clientDocs,
  clientMeds,
  crisisNotes,
  appointments,
  lifecycleHistory,
  anonymized,
  justAnonymized,
  sectionParam,
  assessmentParam,
  aiClientContext,
}: ClientDashboardUIProps) {
  type ClientWorkspaceView = "overview" | "clinic" | "appointments" | "lifecycle";
  const router = useRouter();
  const [isLifecyclePending, startLifecycleTransition] = useTransition();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isCopyingOnboardingLink, setIsCopyingOnboardingLink] = useState(false);
  const id = client.id;
  const isMinor = client.is_minor ?? false;
  const baseUrl = `/dashboard/clients/${id}`;
  const closeSectionOverlay = () => {
    router.replace(baseUrl, { scroll: false });
  };
  const [activeView, setActiveView] = useState<ClientWorkspaceView>(() =>
    assessmentParam ? "clinic" : "overview",
  );
  const lifecycle = deriveClientLifecycle(client, appointments);

  const selectedAssessment = assessmentParam
    ? (assessments.find((a) => a.id === assessmentParam) ?? null)
    : null;

  const upcomingAppointments = appointments
    .filter((a) => isFuture(new Date(a.appointment_date)) && a.status !== "ANULAT")
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 3);
  const pastAppointments = appointments
    .filter((a) => isPast(new Date(a.appointment_date)))
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
    .slice(0, 4);

  const sessionFreqLabel = SESSION_FREQ_LABELS[client.session_frequency ?? ""] ?? null;
  const isB2B = client.billing_type === "B2B_COMPANY";
  const canReactivate = ["INACTIV", "INCHEIAT", "NECONVERSIE"].includes(lifecycle.status);
  const canMarkActive = !anonymized && lifecycle.status !== "ACTIV" && !canReactivate;
  const canMarkInactive = !anonymized && lifecycle.status === "ACTIV";
  const canCloseCase = !anonymized && lifecycle.status !== "INCHEIAT";
  const canMarkNonConversion = !anonymized && ["LEAD", "ONBOARDING", "PROGRAMAT"].includes(lifecycle.status);

  async function handleCopyOnboardingLink() {
    if (typeof window === "undefined") return;

    setIsCopyingOnboardingLink(true);
    try {
      const result = await createClientOnboardingLink(client.id);
      if (result.error || !result.data?.url) {
        toast.error(result.error ?? "Nu am putut genera linkul de onboarding.");
        return;
      }

      await navigator.clipboard.writeText(result.data.url);
      toast.success(
        isMinor
          ? "Linkul securizat pentru onboarding minor a fost copiat."
          : "Linkul de onboarding a fost copiat.",
      );
    } catch {
      toast.error("Nu am putut copia linkul de onboarding.");
    } finally {
      setIsCopyingOnboardingLink(false);
    }
  }

  function handleLifecycleTransition(
    nextStatus: "ACTIV" | "INACTIV" | "INCHEIAT" | "NECONVERSIE",
    successMessage: string,
  ) {
    startLifecycleTransition(async () => {
      try {
        await transitionClientLifecycle(client.id, nextStatus);
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nu am putut actualiza statusul clientului.",
        );
      }
    });
  }

  function handleReactivate() {
    startLifecycleTransition(async () => {
      try {
        const result = await reactivateClientLifecycle(client.id);
        if (!result.success) {
          toast.error(result.error ?? "Nu am putut reactiva clientul.");
          return;
        }
        toast.success("Clientul a fost reactivat pe baza datelor existente.");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nu am putut reactiva clientul.",
        );
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      <PageHeader
        eyebrow={`${lifecycle.stageLabel} din ${format(new Date(client.created_at), "MMM yyyy", { locale: ro })}`}
        title={client.full_name ?? "—"}
        description="Dosarul clinic, financiar și administrativ al clientului într-o singură suprafață."
        action={
          <div className="flex items-center gap-2 shrink-0">
            {!anonymized && (
              <>
                {!lifecycle.isOnboardingComplete && !isMinor && (
                  <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold gap-2">
                    <Link href={`/dashboard/clients/${client.id}/onboarding`}>
                      <ClipboardList className="h-4 w-4 text-primary" /> Onboarding
                    </Link>
                  </Button>
                )}
                {!lifecycle.isOnboardingComplete && isMinor && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCopyOnboardingLink}
                    disabled={isCopyingOnboardingLink}
                    className="rounded-2xl font-bold gap-2"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                    {isCopyingOnboardingLink ? "Generez..." : "Copiază link onboarding"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsContractModalOpen(true)}
                  className="rounded-2xl font-bold gap-2"
                >
                  <FileCheck className="h-4 w-4 text-primary" /> Contract
                </Button>
                <Button asChild size="lg" className="rounded-2xl font-black gap-2">
                  <Link href={`/dashboard/appointments/new?clientId=${client.id}`}>
                    <Plus className="h-5 w-5" /> Programare Nouă
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold">
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {!anonymized && isMinor && !lifecycle.isOnboardingComplete ? (
        <div className="space-y-3">
          <SetupBanner
            title="Onboarding minor nefinalizat"
            description="Pentru minori, fluxul public merge doar printr-un link securizat generat pentru această fișă. Copiază linkul și trimite-l părintelui sau reprezentantului legal."
          />
          <div className="flex justify-start">
            <Button
              type="button"
              onClick={handleCopyOnboardingLink}
              disabled={isCopyingOnboardingLink}
              className="rounded-2xl font-bold gap-2"
            >
              <Copy className="h-4 w-4" />
              {isCopyingOnboardingLink ? "Generez linkul..." : "Copiază linkul securizat"}
            </Button>
          </div>
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-border/60 bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-xl font-black text-primary-foreground shadow-sm shrink-0">
              {client.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={lifecycle.badgeVariant}>
                  {lifecycle.label}
                </Badge>
                {anonymized && (
                  <Badge variant="outline" className="uppercase text-[10px] h-5">
                    Anonim
                  </Badge>
                )}
                {lifecycle.isAnonymizationScheduled && (
                  <Badge variant="warning">
                    Anonimizare programată
                  </Badge>
                )}
                {isMinor && (
                  <Badge variant="warning" className="h-5 text-[10px]">
                    Minor
                  </Badge>
                )}
                {isB2B && (
                  <Badge variant="info" className="h-5 text-[10px]">
                    B2B
                  </Badge>
                )}
                {(() => {
                  const st = isServiceType(client.service_type) ? client.service_type : null;
                  if (!st || st === "UNDECIDED") return null;
                  return (
                    <Badge
                      variant={SERVICE_TYPE_BADGE_VARIANTS[st]}
                      className="h-5 text-[10px]"
                    >
                      {SERVICE_TYPE_LABELS[st]}
                    </Badge>
                  );
                })()}
                {sessionFreqLabel && (
                  <Badge variant="success" className="gap-1.5 border-transparent px-3 py-1 text-xs normal-case tracking-normal">
                    <RefreshCw className="h-3 w-3" /> {sessionFreqLabel}
                  </Badge>
                )}
                {client.session_price && (
                  <Badge variant="info" className="gap-1.5 border-transparent px-3 py-1 text-xs normal-case tracking-normal">
                    <TrendingUp className="h-3 w-3" /> {client.session_price} RON/ședință
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!anonymized && client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Phone className="h-3 w-3" /> {client.phone}
                  </a>
                )}
                {!anonymized && client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Mail className="h-3 w-3" /> {client.email}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <CalendarPlus className="h-3.5 w-3.5" />
                  {lifecycle.stageLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ServiceTrackCard
        serviceType={client.service_type ?? null}
        serviceTrackStatus={client.service_track_status ?? null}
        lifecycleStatus={lifecycle.status}
        gdprSigned={client.gdpr_consent_signed}
        onboardingComplete={lifecycle.isOnboardingComplete}
        hasAppointments={lifecycle.hasCompletedSession || lifecycle.hasUpcomingSession}
        riskLevel={client.risk_level ?? null}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Status Curent
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Badge variant={lifecycle.badgeVariant}>
              {lifecycle.label}
            </Badge>
            <span className="text-xs font-bold text-muted-foreground">{lifecycle.stageLabel}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {lifecycle.description}
          </p>
          {!anonymized ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {canMarkActive ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleLifecycleTransition("ACTIV", "Clientul a fost marcat activ.")}
                  disabled={isLifecyclePending}
                  className="rounded-xl"
                >
                  Marchează activ
                </Button>
              ) : null}
              {canMarkInactive ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLifecycleTransition("INACTIV", "Clientul a fost marcat inactiv.")}
                  disabled={isLifecyclePending}
                  className="rounded-xl"
                >
                  Marchează inactiv
                </Button>
              ) : null}
              {canCloseCase ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLifecycleTransition("INCHEIAT", "Cazul a fost încheiat.")}
                  disabled={isLifecyclePending}
                  className="rounded-xl"
                >
                  Încheie caz
                </Button>
              ) : null}
              {canMarkNonConversion ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLifecycleTransition("NECONVERSIE", "Lead-ul a fost marcat ca neconversie.")}
                  disabled={isLifecyclePending}
                  className="rounded-xl"
                >
                  Neconversie
                </Button>
              ) : null}
              {canReactivate ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleReactivate}
                  disabled={isLifecyclePending}
                  className="rounded-xl"
                >
                  Reactivează
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Următorii Pași
          </p>
          {lifecycle.nextActions.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {lifecycle.nextActions.slice(0, 3).map((action) => (
                <li key={action} className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Fluxul este într-o stare stabilă. Poți continua monitorizarea clinică și administrativă din secțiunile de mai jos.
            </p>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Semnale Administrative
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">GDPR</span>
              <Badge variant={lifecycle.needsGdprConsent ? "warning" : "success"}>
                {lifecycle.needsGdprConsent ? "Lipsă" : "Confirmat"}
              </Badge>
            </div>
            {isMinor ? (
              <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">Reprezentant legal</span>
                <Badge variant={lifecycle.hasGuardianContact ? "success" : "warning"}>
                  {lifecycle.hasGuardianContact ? "Complet" : "Lipsă"}
                </Badge>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">Programări viitoare</span>
              <Badge variant={lifecycle.hasUpcomingSession ? "info" : "outline"}>
                {lifecycle.hasUpcomingSession ? "Există" : "Niciuna"}
              </Badge>
            </div>
            {client.needs_legal_review ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs font-medium">
                  Dosarul are nevoie de verificare legală înainte de a fi considerat complet.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* ── Success banner ────────────────────────────────────────────────── */}
      {justAnonymized && (
        <SetupBanner
          title="Anonimizare reușită"
          description="Datele personale au fost eliminate. Istoricul facturilor și al documentelor administrative a fost păstrat pentru conformitate."
        />
      )}

      <section className="rounded-[1.75rem] border border-border/60 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "clinic", label: "Clinic" },
            { id: "appointments", label: "Programări" },
            { id: "lifecycle", label: "Lifecycle" },
          ].map((view) => {
            const active = activeView === view.id;

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id as ClientWorkspaceView)}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-pressed={active}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <WidgetCard
              icon={Mail}
              title="Contact & Profil"
              value={anonymized ? "REDACTED" : (client.email ?? "—")}
              link="?section=contact"
              badge={client.gdpr_consent_signed ? "GDPR OK" : "GDPR LIPSĂ"}
              badgeVariant={client.gdpr_consent_signed ? "success" : "warning"}
            />
            <WidgetCard
              icon={Wallet}
              title="Financiar"
              value={`${aiClientContext.totalAmount} RON`}
              link="?section=finance"
              subtitle={`${aiClientContext.totalSessions} ședințe totale`}
            />
            <WidgetCard
              icon={FileText}
              title="Dosar Medical"
              value={`${clientDocs.length + clientMeds.length} Fișiere`}
              link="?section=medical"
              subtitle={`${clientMeds.length} medicamente active`}
            />
            <WidgetCard
              icon={ShieldOff}
              title="Monitorizare Risc"
              value={crisisNotes.length > 0 ? `${crisisNotes.length} Note active` : "Fără incidente"}
              link="?section=crisis"
              badge={crisisNotes.length > 0 ? "URGENT" : "STABIL"}
              badgeVariant={crisisNotes.length > 0 ? "destructive" : "outline"}
            />
          </div>

          {!anonymized && <ClientAiAssistant clientContext={aiClientContext} />}
        </>
      ) : null}

      {activeView === "appointments" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Programări viitoare"
            description="Următoarele sesiuni programate pentru acest client."
            icon={Calendar}
          >
            <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Link
                href={`/dashboard/appointments?clientId=${id}`}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Toate <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyState
                title="Nicio programare viitoare"
                description="Când programezi următoarea sesiune, ea va apărea aici împreună cu durata și tipul întâlnirii."
                icon={Calendar}
                action={!anonymized ? { label: "Adaugă programare", href: `/dashboard/appointments/new?clientId=${id}` } : undefined}
              />
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} upcoming />
                ))}
              </div>
            )}
            </div>
          </SectionCard>

          <SectionCard
            title="Istoricul ședințelor"
            description="Ultimele sesiuni finalizate sau încheiate pentru acest client."
            icon={Clock}
          >
            <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {appointments.filter(a => isPast(new Date(a.appointment_date))).length} total
              </span>
            </div>

            {pastAppointments.length === 0 ? (
              <EmptyState
                title="Nicio ședință anterioară"
                description="Istoricul clinic va apărea aici după primele programări finalizate."
                icon={Clock}
              />
            ) : (
              <div className="space-y-2">
                {pastAppointments.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} upcoming={false} />
                ))}
              </div>
            )}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeView === "clinic" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ClientEvolutionChart assessments={assessments} />
            </div>
            <div className="lg:col-span-1">
              <ClientDriveDocuments clientId={id} documents={clientDocs.slice(0, 5)} />
            </div>
          </div>

          <SectionCard
            title="Evaluări psihologice"
            description="Istoric scoruri, sumar clinic și rezultate administrate în timp."
            icon={Brain}
          >
            <div className="space-y-6 p-6">
              <div className="flex justify-end">
                {!anonymized && (
                  <Button variant="outline" size="sm" asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                    <Link href="/dashboard/assessments/new">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Adaugă
                    </Link>
                  </Button>
                )}
              </div>

              {assessments.length === 0 ? (
                <EmptyState
                  title="Nu există evaluări încă"
                  description="După primele teste administrate, aici vor apărea scorurile și interpretările relevante."
                  icon={Brain}
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assessments.map((acc) => (
                    <AssessmentCard key={acc.id} acc={acc} clientId={id} isActive={assessmentParam === acc.id} />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </>
      ) : null}

      {activeView === "lifecycle" ? (
        <SectionCard
          title="Istoric lifecycle"
          description="Ultimele schimbări de status pentru această fișă, utile pentru context administrativ și continuitate."
          icon={Clock}
        >
          <div className="p-6">
            {lifecycleHistory.length > 0 ? (
              <div className="space-y-3">
                {lifecycleHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{STATUS_LABELS[entry.from_status ?? ""] ?? "Inițial"}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{STATUS_LABELS[entry.to_status] ?? entry.to_status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.reason ?? "Fără motiv explicit"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-right">
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(new Date(entry.changed_at), "d MMM yyyy, HH:mm", { locale: ro })}
                      </span>
                      {entry.changed_by_name && (
                        <span className="text-xs text-muted-foreground/70">
                          de {entry.changed_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Istoricul nu este disponibil încă"
                description="După aplicarea migrării și primele tranziții reale, aici vor apărea schimbările de status ale clientului."
                icon={Clock}
              />
            )}
          </div>
        </SectionCard>
      ) : null}

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <PersonalInfoOverlay
        isOpen={sectionParam === "contact"}
        onClose={closeSectionOverlay}
        client={client}
        anonymized={anonymized}
      />
      <FinancialDetailOverlay
        isOpen={sectionParam === "finance"}
        onClose={closeSectionOverlay}
        payments={payments}
        clientName={client.full_name ?? "Client"}
      />
      <MedicalDetailOverlay
        isOpen={sectionParam === "medical"}
        onClose={closeSectionOverlay}
        documents={clientDocs}
        medications={clientMeds}
        clientName={client.full_name ?? "Client"}
      />
      <CrisisNotesDetailOverlay
        isOpen={sectionParam === "crisis"}
        onClose={closeSectionOverlay}
        notes={crisisNotes}
        clientName={client.full_name ?? "Client"}
      />
      {selectedAssessment && (
        <AssessmentDetailOverlay
          assessment={selectedAssessment}
          clientName={client.full_name ?? "Client"}
          isMinor={isMinor}
          sendReportToParent={client.send_report_to_parent ?? false}
          closeUrl={baseUrl}
        />
      )}

      {/* ── Contract Generator ─────────────────────────────────────────── */}
      <ContractGeneratorModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        client={client}
      />
    </div>
  );
}

// ── AppointmentRow ────────────────────────────────────────────────────────────

function AppointmentRow({ appt, upcoming }: { appt: ClientAppointment; upcoming: boolean }) {
  const date = new Date(appt.appointment_date);
  const statusLabels: Record<string, string> = {
    PROGRAMAT: "Programat",
    FINALIZAT: "Finalizat",
    ANULAT: "Anulat",
    REPROGRAMAT: "Reprogramat",
  };
  const statusVariants: Record<string, "info" | "success" | "warning" | "secondary"> = {
    PROGRAMAT: "info",
    FINALIZAT: "success",
    ANULAT: "secondary",
    REPROGRAMAT: "warning",
  };

  return (
    <Link
      href={`/dashboard/appointments/${appt.id}`}
      className="group flex items-center justify-between rounded-2xl border border-transparent bg-muted/40 p-3 transition-all hover:border-primary/20 hover:bg-primary/5"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black",
          upcoming ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {format(date, "d", { locale: ro })}
        </div>
        <div>
          <p className="text-xs font-black leading-none text-foreground">
            {format(date, "EEEE, d MMM", { locale: ro })}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {format(date, "HH:mm")} · {appt.duration_minutes} min
            {appt.meet_link && <><Video className="ml-1 h-2.5 w-2.5" /> Online</>}
            {appt.location_tag && <><MapPin className="ml-1 h-2.5 w-2.5" /> {appt.location_tag}</>}
          </p>
        </div>
      </div>
      <Badge
        variant={statusVariants[appt.status] ?? "secondary"}
        className="rounded-lg px-2 py-1 text-[10px] tracking-wide"
      >
        {statusLabels[appt.status] ?? appt.status}
      </Badge>
    </Link>
  );
}

// ── WidgetCard ────────────────────────────────────────────────────────────────

function WidgetCard({
  icon: Icon,
  title,
  value,
  link,
  subtitle,
  badge,
  badgeVariant = "default",
}: WidgetCardProps) {
  return (
    <ActionCard
      href={link}
      icon={Icon}
      title={title}
      value={value}
      subtitle={subtitle}
      badge={
        badge ? (
          <Badge variant={badgeVariant} className="text-[9px] font-black tracking-widest">
            {badge}
          </Badge>
        ) : undefined
      }
      trailing={<ArrowRight className="h-4 w-4" />}
    />
  );
}

// ── AssessmentCard ────────────────────────────────────────────────────────────

function AssessmentCard({
  acc,
  clientId,
  isActive,
}: {
  acc: ClientAssessment;
  clientId: string;
  isActive: boolean;
}) {
  const scoringTestType =
    typeof acc.scoring_data.test_type === "string"
      ? acc.scoring_data.test_type
      : "Rezultat Test";

  return (
    <ActionCard
      href={`/dashboard/clients/${clientId}?assessment=${acc.id}`}
      icon={Brain}
      title={scoringTestType}
      value={acc.assessment_type.replace(/_/g, " ")}
      subtitle={format(new Date(acc.created_at), "d MMM yyyy", { locale: ro })}
      badge={
        <Badge variant="outline" className="bg-muted border-border/60 text-[9px] font-black uppercase tracking-widest">
          {acc.assessment_type.replace(/_/g, " ")}
        </Badge>
      }
      className={cn(
        "min-h-full",
        isActive && "border-primary ring-4 ring-primary/5 shadow-2xl"
      )}
      trailing={<ArrowRight className="h-4 w-4" />}
      footer={
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary transition-transform group-hover:translate-x-1">
            Vezi Detalii <ArrowRight className="h-3 w-3" />
          </span>
          {acc.sent_to_parent_at ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : null}
        </div>
      }
    >
      <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-tighter text-foreground">
            {scoringTestType}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(acc.scoring_data).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">{k.replace(/_/g, " ")}</span>
              <span className="text-xs font-black text-foreground">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
      {acc.content_summary ? (
        <p className="mt-4 line-clamp-2 text-xs font-medium italic leading-relaxed text-muted-foreground">
          &quot;{acc.content_summary}&quot;
        </p>
      ) : null}
    </ActionCard>
  );
}
