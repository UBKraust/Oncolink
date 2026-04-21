"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  Mail,
  Pencil,
  Phone,
  ShieldOff,
  Plus,
  Brain,
  Wallet,
  FileText,
  ArrowRight,
  ChevronDown
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

interface ClientDashboardUIProps {
  client: any;
  assessments: any[];
  payments: any[];
  clientDocs: any[];
  clientMeds: any[];
  crisisNotes: any[];
  anonymized: boolean;
  justAnonymized: boolean;
  sectionParam: string | undefined;
  assessmentParam: string | undefined;
  aiClientContext: any;
}

export function ClientDashboardUI({
  client,
  assessments,
  payments,
  clientDocs,
  clientMeds,
  crisisNotes,
  anonymized,
  justAnonymized,
  sectionParam,
  assessmentParam,
  aiClientContext
}: ClientDashboardUIProps) {
  
  const id = client.id;
  const isMinor = client.is_minor ?? false;
  const assessmentCloseUrl = `/dashboard/clients/${id}`;

  const selectedAssessment = assessmentParam
    ? (assessments.find(a => a.id === assessmentParam) ?? null)
    : null;

  // Handler for closing overlays by navigating back to base URL
  const handleClose = () => {
    window.history.pushState({}, "", assessmentCloseUrl);
    // Using window.dispatchEvent to notify potential listeners of URL change if needed, 
    // but in Next.js we usually use router.push. 
    // However, since this is a Client Component, we can just use useRouter.
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">
      {/* Header with Navigation and Quick Actions */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/dashboard/clients"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-5">
             <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-xl text-xl font-black text-white">
                {client.full_name?.split(" ").map((n: string) => n[0]).join("")}
             </div>
             <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none flex items-center gap-3">
                   {client.full_name ?? "—"}
                   {anonymized && <Badge variant="outline" className="bg-slate-100 text-slate-400 border-slate-200 uppercase text-[10px] h-5">Anonim</Badge>}
                </h1>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                   <CalendarPlus className="h-3.5 w-3.5" /> 
                   Client activ din {format(new Date(client.created_at), "MMM yyyy", { locale: ro })}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {!anonymized && (
             <Button asChild size="lg" className="rounded-2xl font-black shadow-xl shadow-primary/20 gap-2">
                <Link href={`/dashboard/appointments/new?clientId=${client.id}`}>
                   <Plus className="h-5 w-5" /> Programare Nouă
                </Link>
             </Button>
           )}
           <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold bg-white/50 backdrop-blur-sm border-slate-200">
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                 <Pencil className="h-4 w-4" />
              </Link>
           </Button>
        </div>
      </div>

      {justAnonymized && (
        <div className="rounded-[2rem] border-2 border-emerald-100 bg-emerald-50/50 p-5 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
           <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
           </div>
           <div>
              <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Anonimizare Reușită</p>
              <p className="text-xs font-medium text-emerald-700">Datele personale au fost eliminate. Istoricul facturilor rămâne intact pentru conformitate.</p>
           </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <WidgetCard 
          icon={Mail} 
          title="Contact & Profil" 
          value={anonymized ? "REDACTED" : client.email} 
          link={`?section=contact`}
          badge={client.gdpr_consent_signed ? "GDPR OK" : "GDPR LIPSĂ"}
          badgeVariant={client.gdpr_consent_signed ? "success" : "warning"}
        />
        <WidgetCard 
          icon={Wallet} 
          title="Financiar" 
          value={`${aiClientContext.totalAmount} RON`} 
          link={`?section=finance`}
          subtitle={`${aiClientContext.totalSessions} ședințe totale`}
        />
        <WidgetCard 
          icon={FileText} 
          title="Dosar Medical" 
          value={`${clientDocs.length + clientMeds.length} Fișiere`} 
          link={`?section=medical`}
          subtitle={`${clientMeds.length} medicamente active`}
        />
        <WidgetCard 
          icon={ShieldOff} 
          title="Monitorizare Risc" 
          value={crisisNotes.length > 0 ? `${crisisNotes.length} Note active` : "Fără incidente"} 
          link={`?section=crisis`}
          badge={crisisNotes.length > 0 ? "URGENT" : "STABIL"}
          badgeVariant={crisisNotes.length > 0 ? "destructive" : "outline"}
        />
      </div>

      {/* Secondary Row: Stats & Documents */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <ClientEvolutionChart assessments={assessments} />
        </div>
        <div className="lg:col-span-1">
           <ClientDriveDocuments documents={clientDocs.slice(0, 5)} />
        </div>
      </div>

      {/* Psychological Assessments Segment */}
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
            {assessments.map(acc => (
               <AssessmentCard key={acc.id} acc={acc} clientId={id} isActive={assessmentParam === acc.id} />
            ))}
          </div>
        )}
      </div>

      {/* Floating AI Assistant */}
      {!anonymized && <ClientAiAssistant clientContext={aiClientContext} />}

      {/* --- OVERLAYS --- */}
      
      <PersonalInfoOverlay 
        isOpen={sectionParam === "contact"} 
        onClose={() => { window.location.href = assessmentCloseUrl; }}
        client={client}
        anonymized={anonymized}
      />

      <FinancialDetailOverlay 
        isOpen={sectionParam === "finance"} 
        onClose={() => { window.location.href = assessmentCloseUrl; }}
        payments={payments}
        clientName={client.full_name ?? "Client"}
      />

      <MedicalDetailOverlay 
        isOpen={sectionParam === "medical"} 
        onClose={() => { window.location.href = assessmentCloseUrl; }}
        documents={clientDocs}
        medications={clientMeds}
        clientName={client.full_name ?? "Client"}
      />

      <CrisisNotesDetailOverlay 
        isOpen={sectionParam === "crisis"} 
        onClose={() => { window.location.href = assessmentCloseUrl; }}
        notes={crisisNotes}
        clientName={client.full_name ?? "Client"}
      />

      {selectedAssessment && (
        <AssessmentDetailOverlay
          assessment={selectedAssessment}
          clientName={client.full_name ?? "Client"}
          isMinor={isMinor}
          sendReportToParent={(client as any).send_report_to_parent ?? false}
          closeUrl={assessmentCloseUrl}
        />
      )}
    </div>
  );
}

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
          <Plus className="h-4 w-4" />
       </div>
    </Link>
  );
}

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
