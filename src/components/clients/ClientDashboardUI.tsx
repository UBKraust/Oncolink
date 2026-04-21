"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, isPast, isFuture } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarPlus, CheckCircle2, ChevronLeft, Mail, Pencil, Phone,
  ShieldOff, Plus, Brain, Wallet, FileText, ArrowRight, Clock,
  Calendar, MapPin, Video, RefreshCw, TrendingUp, FileCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ClientEvolutionChart } from "@/components/clients/ClientEvolutionChart";
import { ClientDriveDocuments } from "@/components/clients/ClientDriveDocuments";
import { ClientAiAssistant } from "@/components/clients/ClientAiAssistant";
import { PersonalInfoOverlay } from "@/components/clients/PersonalInfoOverlay";
import { FinancialDetailOverlay } from "@/components/clients/FinancialDetailOverlay";
import { MedicalDetailOverlay } from "@/components/clients/MedicalDetailOverlay";
import { CrisisNotesDetailOverlay } from "@/components/clients/CrisisNotesDetailOverlay";
import { AssessmentDetailOverlay } from "@/components/clients/AssessmentDetailOverlay";
import { ContractGeneratorModal } from "@/components/clients/ContractGeneratorModal";

interface ClientDashboardUIProps {
  client: any;
  assessments: any[];
  payments: any[];
  clientDocs: any[];
  clientMeds: any[];
  crisisNotes: any[];
  appointments: any[];
  anonymized: boolean;
  justAnonymized: boolean;
  sectionParam: string | undefined;
  assessmentParam: string | undefined;
  aiClientContext: any;
}

const SESSION_FREQ_LABELS: Record<string, string> = {
  SAPTAMANAL: "Săptămânal",
  BILUNAR: "Bilunar",
  LUNAR: "Lunar",
  OCAZIONAL: "Ocazional",
};

export function ClientDashboardUI({
  client,
  assessments,
  payments,
  clientDocs,
  clientMeds,
  crisisNotes,
  appointments,
  anonymized,
  justAnonymized,
  sectionParam,
  assessmentParam,
  aiClientContext,
}: ClientDashboardUIProps) {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const id = client.id;
  const isMinor = client.is_minor ?? false;
  const baseUrl = `/dashboard/clients/${id}`;

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

  const sessionFreqLabel = SESSION_FREQ_LABELS[(client as any).session_frequency ?? ""] ?? null;
  const isB2B = (client as any).billing_type === "B2B_COMPANY";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-5">
          <Link
            href="/dashboard/clients"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all shadow-sm shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-xl text-xl font-black text-white shrink-0">
              {client.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none flex flex-wrap items-center gap-2">
                {client.full_name ?? "—"}
                {anonymized && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-400 border-slate-200 uppercase text-[10px] h-5">
                    Anonim
                  </Badge>
                )}
                {isMinor && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 uppercase text-[10px] h-5">
                    Minor
                  </Badge>
                )}
                {isB2B && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] h-5">
                    B2B
                  </Badge>
                )}
              </h1>
              {/* Quick contact chips */}
              <div className="flex flex-wrap items-center gap-2">
                {!anonymized && client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Phone className="h-3 w-3" /> {client.phone}
                  </a>
                )}
                {!anonymized && client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Mail className="h-3 w-3" /> {client.email}
                  </a>
                )}
                {sessionFreqLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <RefreshCw className="h-3 w-3" /> {sessionFreqLabel}
                  </span>
                )}
                {(client as any).session_price && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    <TrendingUp className="h-3 w-3" /> {(client as any).session_price} RON/ședință
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                <CalendarPlus className="h-3.5 w-3.5" />
                Client activ din {format(new Date(client.created_at), "MMM yyyy", { locale: ro })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!anonymized && (
            <>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setIsContractModalOpen(true)}
                className="rounded-2xl font-bold bg-white/50 backdrop-blur-sm border-slate-200 gap-2"
              >
                <FileCheck className="h-4 w-4 text-primary" /> Contract
              </Button>
              <Button asChild size="lg" className="rounded-2xl font-black shadow-xl shadow-primary/20 gap-2">
                <Link href={`/dashboard/appointments/new?clientId=${client.id}`}>
                  <Plus className="h-5 w-5" /> Programare Nouă
                </Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold bg-white/50 backdrop-blur-sm border-slate-200">
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Success banner ────────────────────────────────────────────────── */}
      {justAnonymized && (
        <div className="rounded-[2rem] border-2 border-emerald-100 bg-emerald-50/50 p-5 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Anonimizare Reușită</p>
            <p className="text-xs font-medium text-emerald-700">
              Datele personale au fost eliminate. Istoricul facturilor rămâne intact pentru conformitate.
            </p>
          </div>
        </div>
      )}

      {/* ── 4 Widget Cards ────────────────────────────────────────────────── */}
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

      {/* ── Programări ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Programări Viitoare</h3>
            </div>
            <Link
              href={`/dashboard/appointments?clientId=${id}`}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Toate <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs font-bold text-slate-400">Nicio programare viitoare</p>
              {!anonymized && (
                <Button asChild size="sm" variant="outline" className="mt-3 rounded-xl text-xs font-bold">
                  <Link href={`/dashboard/appointments/new?clientId=${id}`}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adaugă programare
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((appt) => (
                <AppointmentRow key={appt.id} appt={appt} upcoming />
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Istoricul Ședințelor</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {appointments.filter(a => isPast(new Date(a.appointment_date))).length} total
            </span>
          </div>

          {pastAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs font-bold text-slate-400">Nicio ședință anterioară</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastAppointments.map((appt) => (
                <AppointmentRow key={appt.id} appt={appt} upcoming={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Evolution + Documents ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClientEvolutionChart assessments={assessments} />
        </div>
        <div className="lg:col-span-1">
          <ClientDriveDocuments clientId={id} documents={clientDocs.slice(0, 5)} />
        </div>
      </div>

      {/* ── Evaluări Psihologice ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Evaluări Psihologice</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Istoric scoruri și sumar clinic</p>
          </div>
          {!anonymized && (
            <Button variant="outline" size="sm" asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              <Link href="/dashboard/assessments/new">
                <Plus className="mr-1 h-3.5 w-3.5" /> Adaugă
              </Link>
            </Button>
          )}
        </div>

        {assessments.length === 0 ? (
          <div className="rounded-[2.5rem] border-2 border-dashed p-12 text-center bg-slate-50/50">
            <Brain className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400 italic">Nu există evaluări încă.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((acc) => (
              <AssessmentCard key={acc.id} acc={acc} clientId={id} isActive={assessmentParam === acc.id} />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating AI ───────────────────────────────────────────────────── */}
      {!anonymized && <ClientAiAssistant clientContext={aiClientContext} />}

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <PersonalInfoOverlay
        isOpen={sectionParam === "contact"}
        onClose={() => { window.location.href = baseUrl; }}
        client={client}
        anonymized={anonymized}
      />
      <FinancialDetailOverlay
        isOpen={sectionParam === "finance"}
        onClose={() => { window.location.href = baseUrl; }}
        payments={payments}
        clientName={client.full_name ?? "Client"}
      />
      <MedicalDetailOverlay
        isOpen={sectionParam === "medical"}
        onClose={() => { window.location.href = baseUrl; }}
        documents={clientDocs}
        medications={clientMeds}
        clientName={client.full_name ?? "Client"}
      />
      <CrisisNotesDetailOverlay
        isOpen={sectionParam === "crisis"}
        onClose={() => { window.location.href = baseUrl; }}
        notes={crisisNotes}
        clientName={client.full_name ?? "Client"}
      />
      {selectedAssessment && (
        <AssessmentDetailOverlay
          assessment={selectedAssessment}
          clientName={client.full_name ?? "Client"}
          isMinor={isMinor}
          sendReportToParent={(client as any).send_report_to_parent ?? false}
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

function AppointmentRow({ appt, upcoming }: { appt: any; upcoming: boolean }) {
  const date = new Date(appt.appointment_date);
  const statusColors: Record<string, string> = {
    PROGRAMAT: "bg-blue-100 text-blue-700",
    FINALIZAT: "bg-emerald-100 text-emerald-700",
    ANULAT: "bg-slate-100 text-slate-500",
    REPROGRAMAT: "bg-amber-100 text-amber-700",
  };
  const statusLabels: Record<string, string> = {
    PROGRAMAT: "Programat",
    FINALIZAT: "Finalizat",
    ANULAT: "Anulat",
    REPROGRAMAT: "Reprogramat",
  };

  return (
    <Link
      href={`/dashboard/appointments/${appt.id}`}
      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-9 w-9 flex items-center justify-center rounded-xl text-xs font-black shrink-0",
          upcoming ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
        )}>
          {format(date, "d", { locale: ro })}
        </div>
        <div>
          <p className="text-xs font-black text-slate-800 leading-none">
            {format(date, "EEEE, d MMM", { locale: ro })}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {format(date, "HH:mm")} · {appt.duration_minutes} min
            {appt.meet_link && <><Video className="h-2.5 w-2.5 ml-1" /> Online</>}
            {appt.location_tag && <><MapPin className="h-2.5 w-2.5 ml-1" /> {appt.location_tag}</>}
          </p>
        </div>
      </div>
      <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide", statusColors[appt.status] ?? "bg-slate-100 text-slate-500")}>
        {statusLabels[appt.status] ?? appt.status}
      </span>
    </Link>
  );
}

// ── WidgetCard ────────────────────────────────────────────────────────────────

function WidgetCard({ icon: Icon, title, value, link, subtitle, badge, badgeVariant = "default" }: any) {
  return (
    <Link
      href={link}
      className="group relative flex flex-col p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <Icon className="h-5 w-5" />
        </div>
        {badge && <Badge variant={badgeVariant as any} className="text-[9px] font-black tracking-widest">{badge}</Badge>}
      </div>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-lg font-black text-slate-800 leading-tight truncate">{value}</p>
      {subtitle && <p className="text-[11px] font-bold text-slate-400 mt-1 italic leading-none">{subtitle}</p>}
      <div className="absolute bottom-6 right-6 h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 transition-all text-primary">
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

// ── AssessmentCard ────────────────────────────────────────────────────────────

function AssessmentCard({ acc, clientId, isActive }: any) {
  return (
    <Link
      href={`/dashboard/clients/${clientId}?assessment=${acc.id}`}
      className={cn(
        "group flex flex-col rounded-[2.5rem] bg-white border-2 border-slate-100 p-6 transition-all hover:shadow-xl hover:border-primary/30",
        isActive && "border-primary ring-4 ring-primary/5 shadow-2xl"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
          {acc.assessment_type.replace(/_/g, " ")}
        </Badge>
        <span className="text-[10px] font-bold text-slate-400 tracking-wide">
          {format(new Date(acc.created_at), "d MMM yyyy", { locale: ro })}
        </span>
      </div>
      <div className="flex-1 space-y-4">
        <div className="rounded-3xl bg-slate-50/50 p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">
              {acc.scoring_data.test_type || "Rezultat Test"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {Object.entries(acc.scoring_data).slice(0, 2).map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{k.replace(/_/g, " ")}</span>
                <span className="text-xs font-black text-slate-800">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
        {acc.content_summary && (
          <p className="text-xs font-medium text-slate-500 line-clamp-2 italic leading-relaxed">"{acc.content_summary}"</p>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Vezi Detalii <ArrowRight className="h-3 w-3" />
        </span>
        {acc.sent_to_parent_at && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      </div>
    </Link>
  );
}
