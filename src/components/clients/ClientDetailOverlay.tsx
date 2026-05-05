"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Building,
  Trash2,
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
  sendOnboardingEmail,
  revokeClientConsent,
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
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isRevokingConsent, setIsRevokingConsent] = useState(false);
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

  async function handleRevokeConsent() {
    setIsRevokingConsent(true);
    try {
      const result = await revokeClientConsent(currentClient.id);
      if (!result.success) {
        toast.error(result.error ?? "Nu am putut revoca consimțământul.");
        return;
      }
      toast.success("Consimțământul a fost revocat și token-urile active au fost invalidate.");
      router.refresh();
    } catch {
      toast.error("Eroare neașteptată la revocarea consimțământului.");
    } finally {
      setIsRevokingConsent(false);
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[60] flex justify-end transition-opacity duration-300",
      "opacity-100"
    )} role="dialog" aria-modal="true" aria-labelledby="client-overlay-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Pane */}
      <div
        ref={panelRef}
        className={cn(
        "relative flex h-full w-full max-w-xl flex-col bg-card shadow-2xl transition-transform duration-500 ease-out",
        "translate-x-0"
        )}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border/70 bg-muted/20">
           <div className="flex flex-col gap-4 p-6">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Închide fișa clientului"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-6">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary shadow-sm">
                    {initialsFromName(client.full_name)}
                 </div>
                 <div className="space-y-1">
                    <h2 id="client-overlay-title" className="text-xl font-black tracking-tight leading-none text-foreground">
                      {client.full_name ?? "Client"}
                    </h2>
                    <div className="flex items-center gap-2">
                       {client.is_minor ? (
                         <Badge variant="warning" className="gap-1 text-[9px] tracking-widest">
                           <Baby className="h-3 w-3" /> Minor
                         </Badge>
                       ) : (
                         <Badge variant="success" className="text-[9px] tracking-widest">
                           Adult
                         </Badge>
                       )}
                       {client.billing_type === "B2B_COMPANY" && (
                         <Badge variant="info" className="gap-1 text-[9px] tracking-widest">
                           <Building className="h-3 w-3" /> B2B
                         </Badge>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Bar */}
         <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-background p-4">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-border/60" disabled={anonymized || !client.phone} asChild={!anonymized && !!client.phone}>
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
           <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-border/60" disabled={anonymized || !client.email} asChild={!anonymized && !!client.email}>
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
            <Button className="gap-2 rounded-xl flex-1 shadow-sm" asChild>
               <Link href={`/dashboard/clients/${client.id}`}>
                  <ExternalLink className="h-4 w-4" /> Detalii Fișă
               </Link>
            </Button>
         </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
           {/* Section: Anonymization Grace Period Alert */}
           {showScheduledAlert && !anonymized && (
             <div className="animate-in fade-in slide-in-from-top-4 space-y-4 rounded-[1.75rem] border border-destructive/20 bg-destructive/5 p-5 duration-500">
                <div className="flex items-start gap-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-sm">
                      <Clock className="h-6 w-6" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-tight text-destructive">Ciclul de Anonimizare Activat</p>
                      <p className="text-xs font-bold leading-relaxed text-destructive/85">
                        Toate datele personale (PII) vor fi șterse definitiv peste <span className="mx-1 rounded-md bg-destructive px-2 py-0.5 text-destructive-foreground">{daysLeft} zile</span> conform cererii de anonimizare.
                      </p>
                   </div>
                </div>
                <Button 
                  onClick={handleCancel}
                  disabled={isPending}
                  variant="outline"
                  className="w-full rounded-2xl border-destructive/20 font-black text-destructive transition-all hover:bg-destructive/5 hover:text-destructive active:scale-95"
                >
                   <History className="h-4 w-4 mr-2" /> RESTABILEȘTE DATELE ACUM
                </Button>
             </div>
           )}

           {/* Section: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               <Card className="rounded-2xl border-border/60 bg-muted/40 shadow-none">
                  <CardContent className="p-4 flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Sesiuni</span>
                     <span className="text-xl font-black text-foreground">{loadingOverview ? "..." : overview?.totalSessions ?? 0}</span>
                     <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                        <TrendingUp className="h-3 w-3" /> activitate curentă
                     </div>
                  </CardContent>
               </Card>
               <Card className="rounded-2xl border-border/60 bg-muted/40 shadow-none">
                  <CardContent className="p-4 flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ultima Ședință</span>
                     <span className="text-sm font-black text-foreground">
                       {loadingOverview ? "..." : overview?.lastAppointmentDate ? format(new Date(overview.lastAppointmentDate), "dd MMM yyyy", { locale: ro }) : "—"}
                     </span>
                     <span className="text-[10px] font-medium text-muted-foreground">istoric clinic</span>
                  </CardContent>
               </Card>
            </div>

           {/* Section: Contact & Info */}
           <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                 <User className="h-3 w-3" /> Informații de Contact
              </h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3">
                    <div className="flex items-center gap-3">
                       <Mail className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium text-foreground/80">{anonymized ? "REDACTED" : client.email || "nespecificat"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                 <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3">
                    <div className="flex items-center gap-3">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium text-foreground/80">{anonymized ? "REDACTED" : client.phone || "nespecificat"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                 <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                       <span className="block text-sm font-medium leading-tight text-foreground/80">
                         {client.address || "Adresă nespecificată"}
                       </span>
                       <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                   "flex items-center justify-between rounded-2xl border p-4 transition-all shadow-sm",
                   client.gdpr_consent_signed
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : "animate-pulse-subtle border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                 )}>
                    <div className="flex items-center gap-3">
                       {client.gdpr_consent_signed ? (
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                         </div>
                       ) : (
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm">
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
                          className="flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-[10px] font-black uppercase text-white shadow-sm hover:bg-emerald-700"
                          title="Trimite pe WhatsApp"
                        >
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WA
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSendEmailOnboarding}
                          disabled={isNotifying || !client.email}
                          variant="outline"
                          className="flex h-8 items-center gap-1.5 rounded-full border-amber-300 px-3 text-[10px] font-black uppercase text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900/40"
                          title="Trimite pe Email"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </Button>
                      </div>
                    )}
                 </div>

                 {client.is_minor && (
                    <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                       <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-sky-950 dark:text-sky-100">Documente Custodie</p>
                             <p className="text-[10px] font-medium text-sky-800 dark:text-sky-200">Situație: {client.parents_marital_status || "Nesalvat"}</p>
                          </div>
                        <Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-100/50 hover:text-sky-800 dark:text-sky-200 dark:hover:bg-sky-900/40" asChild>
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
               <div className="relative space-y-6 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-px before:bg-border">
                  {loadingOverview ? (
                    <div className="animate-pulse pl-8 text-xs text-muted-foreground">Se încarcă istoricul...</div>
                  ) : overview?.recentInteractions && overview.recentInteractions.length > 0 ? (
                    overview.recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="relative pl-8">
                        <div className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                        <div className="space-y-1">
                           <p className="text-xs font-black text-foreground">{interaction.status === "COMPLETED" ? "Ședință Încheiată" : "Programare Istorică"}</p>
                           <p className="text-[11px] text-muted-foreground">{format(new Date(interaction.date), "dd MMM yyyy • HH:mm", { locale: ro })}</p>
                           <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-2 text-[10px] italic text-foreground/70">
                              &quot;{interaction.summary}&quot;
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-8 text-xs italic text-muted-foreground">Nicio interacțiune înregistrată încă.</div>
                  )}

                  {overview?.nextAppointment && (
                    <div className="relative pl-8">
                       <div className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-sky-100 dark:ring-sky-950" />
                       <div className="space-y-1">
                          <p className="text-xs font-black text-sky-700 dark:text-sky-200">Următoarea Programare</p>
                          <p className="text-[11px] text-muted-foreground">{format(new Date(overview.nextAppointment.date), "dd MMM yyyy • HH:mm", { locale: ro })}</p>
                       </div>
                      </div>
                    )}
                 </div>
                 {(client.gdpr_consent_signed || client.terms_consent_signed_at || client.legal_liability_consent_signed_at) && (
                   <AlertDialog>
                     <AlertDialogTrigger>
                       <Button
                         size="sm"
                         variant="outline"
                         className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                         disabled={isRevokingConsent}
                       >
                         <ShieldAlert className="mr-2 h-4 w-4" />
                         {isRevokingConsent ? "Se revocă..." : "Revocă consimțământul"}
                       </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent className="rounded-[2rem]">
                       <AlertDialogHeader>
                         <AlertDialogTitle>Revoci consimțământul acestui client?</AlertDialogTitle>
                         <AlertDialogDescription>
                           Vom marca GDPR-ul și consimțămintele legale ca revocate, iar link-urile active de onboarding vor fi invalidate.
                         </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Păstrează</AlertDialogCancel>
                         <AlertDialogAction
                           onClick={handleRevokeConsent}
                           className="bg-destructive hover:bg-destructive/90"
                         >
                           Revocă acum
                         </AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
                 )}
              </div>
           </div>

        {/* Sticky Footer Actions */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/70 bg-background p-6">
           {!anonymized && !showScheduledAlert ? (
             <div className="flex flex-1 gap-3">
               <AlertDialog>
                 <AlertDialogTrigger>
                   <Button variant="outline" className="flex-1 rounded-2xl border-destructive/20 font-bold text-destructive hover:bg-destructive/5 hover:text-destructive">
                      <ShieldAlert className="h-4 w-4 mr-2" /> Anonimizare
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
                   <AlertDialogHeader className="space-y-4">
                     <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
                        <ShieldAlert className="h-10 w-10" />
                     </div>
                     <AlertDialogTitle className="text-center text-2xl font-black leading-tight text-foreground">
                       Siguranța Datelor:<br/>Ești sigur?
                     </AlertDialogTitle>
                     <AlertDialogDescription className="text-center font-medium leading-relaxed text-muted-foreground">
                       Prin anonimizare, vom șterge definitiv Numele, Email-ul, Telefonul și Adresa pacientului. 
                       <br/><br/>
                       <span className="font-black text-foreground">Vei avea 15 zile la dispoziție pentru a anula procesul dacă te răzgândești.</span>
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
                     <AlertDialogAction 
                       onClick={handleSchedule}
                       className="h-12 w-full rounded-2xl bg-destructive font-black text-destructive-foreground shadow-sm hover:bg-destructive/90"
                     >
                       DA, PROGRAMEAZĂ ANONIMIZAREA
                     </AlertDialogAction>
                     <AlertDialogCancel className="h-12 w-full rounded-2xl border-none font-bold hover:bg-muted">
                       RENUNȚĂ
                     </AlertDialogCancel>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
               <Button variant="ghost" className="rounded-2xl text-destructive hover:bg-destructive/5 hover:text-destructive" asChild>
                 <Link href={`/dashboard/clients/${client.id}/delete`}>
                   <Trash2 className="h-4 w-4 mr-2" /> Ștergere
                 </Link>
               </Button>
             </div>
           ) : (
             <Button variant="outline" className="flex-1 rounded-2xl border-border/60 text-muted-foreground font-bold italic" disabled>
                {anonymized ? "Pacient Anonimizat" : "Anonimizare în curs..."}
             </Button>
           )}
           <Button className="flex-1 rounded-2xl font-black shadow-sm" disabled={showScheduledAlert || anonymized} asChild>
              <Link href={`/dashboard/appointments/new?clientId=${client.id}`}>
                 <Calendar className="h-4 w-4 mr-2" /> Programare
              </Link>
           </Button>
        </div>
      </div>
    </div>
  );
}
