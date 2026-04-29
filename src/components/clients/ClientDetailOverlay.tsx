"use client";

import { useEffect, useRef, useState } from "react";
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  ExternalLink,
  MessageCircle,
  Clock,
  History,
  TrendingUp,
  Baby,
  Building
} from "lucide-react";
import { ContractGenerator } from "./ContractGenerator";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClientOverview, ClientProfile } from "./types";
import { initialsFromName } from "@/lib/clients/validation";
import { cn } from "@/lib/utils";
import { 
  scheduleAnonymization, 
  cancelAnonymization, 
  sendOnboardingNotification, 
  getClientOverview,
  sendOnboardingEmail 
} from "@/app/dashboard/clients/actions";
import { toast } from "@/components/ui/toast";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClientDetailOverlayProps {
  client: ClientProfile | null;
  onClose: () => void;
}

export function ClientDetailOverlay({ client, onClose }: ClientDetailOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [overrideScheduledState, setOverrideScheduledState] = useState<{
    clientId: string | null;
    value: Date | null;
  }>({
    clientId: null,
    value: null,
  });
  const [overviewState, setOverviewState] = useState<{
    clientId: string | null;
    data: ClientOverview | null;
  }>({
    clientId: null,
    data: null,
  });

  useEffect(() => {
    if (!client) return;

    let active = true;
    getClientOverview(client.id).then((data) => {
      if (!active) return;
      setOverviewState({
        clientId: client.id,
        data,
      });
    });

    return () => {
      active = false;
    };
  }, [client]);

  useOverlayA11y({
    open: Boolean(client),
    onClose,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
  });

  if (!client) return null;
  const currentClient = client;
  const overview = overviewState.clientId === currentClient.id ? overviewState.data : null;
  const loadingOverview = overviewState.clientId !== currentClient.id;

  const anonymized = Boolean(currentClient.notes_anonymized_at);
  const actualScheduledAt = currentClient.scheduled_anonymization_at
    ? new Date(currentClient.scheduled_anonymization_at)
    : null;
  const overrideScheduledAt =
    overrideScheduledState.clientId === currentClient.id ? overrideScheduledState.value : null;
  const scheduledAt = overrideScheduledAt !== null ? overrideScheduledAt : actualScheduledAt;
  const isScheduled = !!scheduledAt;
  
  const daysLeft = isScheduled && scheduledAt.getTime() > 10000
    ? Math.max(0, Math.ceil((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;
    
  const showScheduledAlert = isScheduled && scheduledAt.getTime() > 10000;

  async function handleSchedule() {
    setIsPending(true);
    const res = await scheduleAnonymization(currentClient.id);
    setIsPending(false);
    if (res?.success) {
      toast.success("Anonimizare programată în 15 zile.");
    } else if (res?.error?.includes("Mod demo")) {
      const mockDate = new Date();
      mockDate.setDate(mockDate.getDate() + 15);
      setOverrideScheduledState({
        clientId: currentClient.id,
        value: mockDate,
      });
      toast.success("Mod Demo: Anonimizare simulată.");
    } else {
      toast.error("Eroare: " + res?.error);
    }
  }

  async function handleCancel() {
    setIsPending(true);
    const res = await cancelAnonymization(currentClient.id);
    setIsPending(false);
    if (res?.success) {
      toast.success("Anonimizare anulată. Datele au fost recuperate.");
    } else if (res?.error?.includes("Mod demo")) {
      // Simulate un-scheduling
      setOverrideScheduledState({
        clientId: currentClient.id,
        value: new Date(0),
      }); // Use epoch to explicitly say "cleared" without matching null
      toast.success("Mod Demo: Datele au fost recuperate.");
    } else {
      toast.error("Eroare: " + res?.error);
    }
  }

  async function handleSendOnboarding() {
    if (!currentClient.phone) {
      toast.error("Clientul nu are un număr de telefon valid.");
      return;
    }
    
    setIsNotifying(true);
    try {
      const res = await sendOnboardingNotification(
        currentClient.id,
        currentClient.full_name ?? "Client",
        currentClient.phone,
      );
      if (res.success) {
        toast.success("Link-ul de onboarding a fost trimis pe WhatsApp.");
      } else {
        toast.error("Eroare la trimitere: " + res.error);
      }
    } catch {
      toast.error("Eroare neașteptată la trimitere.");
    } finally {
      setIsNotifying(false);
    }
  }

  async function handleSendEmailOnboarding() {
    if (!currentClient.email) {
      toast.error("Clientul nu are o adresă de email validă.");
      return;
    }
    
    setIsNotifying(true);
    try {
      const res = await sendOnboardingEmail(
        currentClient.id,
        currentClient.full_name ?? "Client",
        currentClient.email,
      );
      if (res.success) {
        toast.success("Link-ul de onboarding a fost trimis prin Email.");
      } else {
        toast.error("Eroare la trimitere: " + res.error);
      }
    } catch {
      toast.error("Eroare neașteptată la trimitere.");
    } finally {
      setIsNotifying(false);
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[110] flex justify-end transition-opacity duration-300",
      "opacity-100"
    )} role="dialog" aria-modal="true" aria-labelledby="client-overlay-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Pane */}
      <div
        ref={panelRef}
        className={cn(
        "relative h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col",
        "translate-x-0"
        )}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="relative h-48 shrink-0 overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900 opacity-80" />
           {/* Abstract pattern */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-10 -mb-10" />
           
           <div className="relative h-full p-8 flex flex-col justify-end gap-4">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Închide fișa clientului"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-6">
                 <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl font-black text-white shadow-2xl ring-4 ring-white/10">
                    {initialsFromName(client.full_name)}
                 </div>
                 <div className="space-y-1">
                    <h2 id="client-overlay-title" className="text-2xl font-black text-white tracking-tight leading-none">
                      {client.full_name ?? "Client"}
                    </h2>
                    <div className="flex items-center gap-2">
                       {client.is_minor ? (
                         <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold uppercase text-[9px] tracking-widest gap-1">
                           <Baby className="h-3 w-3" /> Minor
                         </Badge>
                       ) : (
                         <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold uppercase text-[9px] tracking-widest">
                           Adult
                         </Badge>
                       )}
                       {client.billing_type === "B2B_COMPANY" && (
                         <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold uppercase text-[9px] tracking-widest gap-1">
                           <Building className="h-3 w-3" /> B2B
                         </Badge>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Bar */}
         <div className="flex items-center gap-2 p-4 border-b bg-slate-50/50 shrink-0">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-slate-200" disabled={anonymized || !client.phone} asChild={!anonymized && !!client.phone}>
               {anonymized || !client.phone ? (
                 <>
                   <Phone className="h-4 w-4" /> Telefon
                 </>
               ) : (
                 <a href={`tel:${client.phone}`}>
                   <Phone className="h-4 w-4" /> Telefon
                 </a>
               )}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-slate-200" disabled={anonymized || !client.email} asChild={!anonymized && !!client.email}>
               {anonymized || !client.email ? (
                 <>
                   <Mail className="h-4 w-4" /> Email
                 </>
               ) : (
                 <a href={`mailto:${client.email}`}>
                   <Mail className="h-4 w-4" /> Email
                 </a>
               )}
            </Button>
            <Button className="gap-2 rounded-xl flex-1 shadow-md" asChild>
               <a href={`/dashboard/clients/${client.id}`}>
                  <ExternalLink className="h-4 w-4" /> Detalii Fișă
               </a>
            </Button>
         </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar">
           {/* Section: Anonymization Grace Period Alert */}
           {showScheduledAlert && !anonymized && (
             <div className="p-5 rounded-[2rem] bg-rose-50 border-2 border-rose-100 shadow-lg shadow-rose-200/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 shrink-0">
                      <Clock className="h-6 w-6 animate-pulse" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Ciclul de Anonimizare Activat</p>
                      <p className="text-xs font-bold text-rose-700 leading-relaxed">
                        Toate datele personale (PII) vor fi șterse definitiv peste <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md mx-1">{daysLeft} zile</span> conform cererii de anonimizare.
                      </p>
                   </div>
                </div>
                <Button 
                  onClick={handleCancel}
                  disabled={isPending}
                  className="w-full bg-white hover:bg-slate-50 text-rose-600 border-2 border-rose-100 rounded-2xl font-black shadow-md transition-all active:scale-95"
                >
                   <History className="h-4 w-4 mr-2" /> RESTABILEȘTE DATELE ACUM
                </Button>
             </div>
           )}

           {/* Section: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               <Card className="rounded-2xl border-none bg-slate-100/50 shadow-none">
                  <CardContent className="p-4 flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sesiuni</span>
                     <span className="text-xl font-black text-slate-800">{loadingOverview ? "..." : overview?.totalSessions ?? 0}</span>
                     <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <TrendingUp className="h-3 w-3" /> activitate curentă
                     </div>
                  </CardContent>
               </Card>
               <Card className="rounded-2xl border-none bg-slate-100/50 shadow-none">
                  <CardContent className="p-4 flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ultima Ședință</span>
                     <span className="text-sm font-black text-slate-800">
                       {loadingOverview ? "..." : overview?.lastAppointmentDate ? format(new Date(overview.lastAppointmentDate), "dd MMM yyyy", { locale: ro }) : "—"}
                     </span>
                     <span className="text-[10px] text-slate-500 font-medium">istoric clinic</span>
                  </CardContent>
               </Card>
            </div>

           {/* Section: Contact & Info */}
           <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                 <User className="h-3 w-3" /> Informații de Contact
              </h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Mail className="h-4 w-4 text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{anonymized ? "REDACTED" : client.email || "nespecificat"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary"
                      disabled={anonymized || !client.email}
                      aria-label="Trimite email clientului"
                      asChild={!anonymized && !!client.email}
                    >
                      {anonymized || !client.email ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <a href={`mailto:${client.email}`}>
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </Button>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Phone className="h-4 w-4 text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{anonymized ? "REDACTED" : client.phone || "nespecificat"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary"
                      disabled={anonymized || !client.phone}
                      aria-label="Apelează clientul"
                      asChild={!anonymized && !!client.phone}
                    >
                      {anonymized || !client.phone ? (
                        <Phone className="h-4 w-4" />
                      ) : (
                        <a href={`tel:${client.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </Button>
                 </div>
                 <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div className="space-y-1">
                       <span className="text-sm font-medium text-slate-600 block leading-tight">
                         {client.address || "Adresă nespecificată"}
                       </span>
                       <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                         Locație: {client.location === "CLINICA" ? "Clinică" : "Cabinet"}
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section: Legal & Compliance */}
           <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                 <ShieldCheck className="h-3 w-3" /> Status Legal & GDPR
              </h3>
              <div className="grid gap-3">
                 <div className={cn(
                   "flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm",
                   client.gdpr_consent_signed 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
                    : "bg-rose-50/50 border-rose-100 text-rose-900 animate-pulse-subtle"
                 )}>
                    <div className="flex items-center gap-3">
                       {client.gdpr_consent_signed ? (
                         <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <ShieldCheck className="h-5 w-5" />
                         </div>
                       ) : (
                         <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <ShieldAlert className="h-5 w-5" />
                         </div>
                       )}
                       <div>
                          <p className="text-sm font-black">Contract & GDPR</p>
                          <p className="text-[10px] font-medium opacity-80">
                            {client.gdpr_consent_signed ? "Actualizat la zi" : "Acțiune Necesara: Onboarding"}
                          </p>
                       </div>
                    </div>
                    {!client.gdpr_consent_signed && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSendOnboarding}
                          disabled={isNotifying || !client.phone}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-8 rounded-full font-black uppercase px-3 shadow-lg shadow-emerald-100 flex items-center gap-1.5"
                          title="Trimite pe WhatsApp"
                        >
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WA
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSendEmailOnboarding}
                          disabled={isNotifying || !client.email}
                          className="bg-rose-600 hover:bg-rose-700 text-[10px] h-8 rounded-full font-black uppercase px-3 shadow-lg shadow-rose-100 flex items-center gap-1.5"
                          title="Trimite pe Email"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </Button>
                      </div>
                    )}
                 </div>

                 {client.is_minor && (
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-blue-900">Documente Custodie</p>
                             <p className="text-[10px] text-blue-700 font-medium">Situație: {client.parents_marital_status || "Nesalvat"}</p>
                          </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50" asChild>
                           <a href={`/dashboard/clients/${client.id}?section=documents`}>
                              Vezi Doc
                           </a>
                        </Button>
                    </div>
                  </div>
               )}

                 {/* NEW: Contract Generator Component */}
                 <div className="pt-2">
                    <ContractGenerator key={client.id} client={client} />
                 </div>
              </div>
           </div>

           {/* Quick History Log */}
            <div className="space-y-4 pt-2 pb-10">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <History className="h-3 w-3" /> Ultimele Interacțiuni
               </h3>
               <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {loadingOverview ? (
                    <div className="pl-8 text-xs text-slate-400 animate-pulse">Se încarcă istoricul...</div>
                  ) : overview?.recentInteractions && overview.recentInteractions.length > 0 ? (
                    overview.recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50 pointer-events-none" />
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-700">{interaction.status === "COMPLETED" ? "Ședință Încheiată" : "Programare Istorică"}</p>
                           <p className="text-[11px] text-slate-500">{format(new Date(interaction.date), "dd MMM yyyy • HH:mm", { locale: ro })}</p>
                           <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 italic">
                              &quot;{interaction.summary}&quot;
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-8 text-xs text-slate-400 italic">Nicio interacțiune înregistrată încă.</div>
                  )}

                  {overview?.nextAppointment && (
                    <div className="relative pl-8">
                       <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-400 ring-4 ring-blue-50 pointer-events-none" />
                       <div className="space-y-1">
                          <p className="text-xs font-black text-blue-600">Următoarea Programare</p>
                          <p className="text-[11px] text-slate-500">{format(new Date(overview.nextAppointment.date), "dd MMM yyyy • HH:mm", { locale: ro })}</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-6 bg-slate-50/80 backdrop-blur-sm border-t shrink-0 flex items-center justify-between gap-4 rounded-t-3xl shadow-lg border-slate-100">
           {!anonymized && !showScheduledAlert ? (
             <AlertDialog>
               <AlertDialogTrigger>
                 <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Anonimizare
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
                 <AlertDialogHeader className="space-y-4">
                   <div className="h-16 w-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                      <ShieldAlert className="h-10 w-10" />
                   </div>
                   <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 leading-tight">
                     Siguranța Datelor:<br/>Ești sigur?
                   </AlertDialogTitle>
                   <AlertDialogDescription className="text-slate-500 font-medium text-center leading-relaxed">
                     Prin anonimizare, vom șterge definitiv Numele, Email-ul, Telefonul și Adresa pacientului. 
                     <br/><br/>
                     <span className="font-black text-slate-800">Vei avea 15 zile la dispoziție pentru a anula procesul dacă te răzgândești.</span>
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
                   <AlertDialogAction 
                     onClick={handleSchedule}
                     className="bg-rose-600 hover:bg-rose-700 text-white font-black h-12 rounded-2xl w-full shadow-xl shadow-rose-200"
                   >
                     DA, PROGRAMEAZĂ ANONIMIZAREA
                   </AlertDialogAction>
                   <AlertDialogCancel className="border-none hover:bg-slate-100 font-bold h-12 rounded-2xl w-full">
                     RENUNȚĂ
                   </AlertDialogCancel>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
           ) : (
             <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 text-slate-400 font-bold italic" disabled>
                {anonymized ? "Pacient Anonimizat" : "Anonimizare în curs..."}
             </Button>
           )}
           <Button className="flex-1 rounded-2xl font-black shadow-xl shadow-primary/20" disabled={showScheduledAlert || anonymized} asChild>
              <a href={`/dashboard/appointments/new?clientId=${client.id}`}>
                 <Calendar className="h-4 w-4 mr-2" /> Programare
              </a>
           </Button>
        </div>
      </div>
    </div>
  );
}
