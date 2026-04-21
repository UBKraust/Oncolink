"use client";

import React, { useEffect, useState } from "react";
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
  Activity,
  History,
  TrendingUp,
  Baby,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { initialsFromName } from "@/lib/clients/validation";
import { cn } from "@/lib/utils";
import { scheduleAnonymization, cancelAnonymization } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";
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
  client: any | null;
  onClose: () => void;
}

export function ClientDetailOverlay({ client, onClose }: ClientDetailOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (client) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [client]);

  if (!client) return null;

  const anonymized = Boolean(client.notes_anonymized_at);
  const scheduledAt = client.scheduled_anonymization_at ? new Date(client.scheduled_anonymization_at) : null;
  const isScheduled = !!scheduledAt;
  
  const daysLeft = isScheduled 
    ? Math.max(0, Math.ceil((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleSchedule() {
    setIsPending(true);
    const res = await scheduleAnonymization(client.id);
    setIsPending(false);
    if (res.success) {
      toast.success("Anonimizare programată în 15 zile.");
    } else {
      toast.error("Eroare: " + res.error);
    }
  }

  async function handleCancel() {
    setIsPending(true);
    const res = await cancelAnonymization(client.id);
    setIsPending(false);
    if (res.success) {
      toast.success("Anonimizare anulată. Datele au fost recuperate.");
    } else {
      toast.error("Eroare: " + res.error);
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[110] flex justify-end transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Pane */}
      <div className={cn(
        "relative h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col",
        isVisible ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="relative h-48 shrink-0 overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900 opacity-80" />
           {/* Abstract pattern */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-10 -mb-10" />
           
           <div className="relative h-full p-8 flex flex-col justify-end gap-4">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-6">
                 <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl font-black text-white shadow-2xl ring-4 ring-white/10">
                    {initialsFromName(client.full_name)}
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                      {client.full_name}
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
           <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-slate-200" disabled={anonymized}>
              <Phone className="h-4 w-4" /> Telefon
           </Button>
           <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 border-slate-200" disabled={anonymized}>
              <Mail className="h-4 w-4" /> Email
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
           {isScheduled && !anonymized && (
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
                    <span className="text-xl font-black text-slate-800">12</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                       <TrendingUp className="h-3 w-3" /> +2 luna asta
                    </div>
                 </CardContent>
              </Card>
              <Card className="rounded-2xl border-none bg-slate-100/50 shadow-none">
                 <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ultima Ședință</span>
                    <span className="text-sm font-black text-slate-800">14 Apr 2026</span>
                    <span className="text-[10px] text-slate-500 font-medium">Acum 7 zile</span>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                       <MessageCircle className="h-4 w-4" />
                    </Button>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Phone className="h-4 w-4 text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{anonymized ? "REDACTED" : client.phone || "nespecificat"}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                       <Phone className="h-4 w-4" />
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
                      <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-[10px] h-8 rounded-full font-black uppercase px-4 shadow-xl shadow-rose-200">
                        Trimite Link
                      </Button>
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
                       </div>
                       <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50">
                          Vezi Doc
                       </Button>
                    </div>
                 )}
              </div>
           </div>

           {/* Quick History Log */}
           <div className="space-y-4 pt-2 pb-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                 <History className="h-3 w-3" /> Ultimele Interacțiuni
              </h3>
              <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 <div className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50 pointer-events-none" />
                    <div className="space-y-1">
                       <p className="text-xs font-black text-slate-700">Ședință Individuală</p>
                       <p className="text-[11px] text-slate-500">14 Apr 2026 • 10:30</p>
                       <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 italic">
                          "Progrese vizibile în gestionarea anxietății sociale..."
                       </div>
                    </div>
                 </div>
                 <div className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-slate-50 pointer-events-none" />
                    <div className="space-y-1">
                       <p className="text-xs font-black text-slate-500 italic">Programare Viitoare</p>
                       <p className="text-[11px] text-slate-400">22 Apr 2026 • 11:00</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-6 bg-slate-50/80 backdrop-blur-sm border-t shrink-0 flex items-center justify-between gap-4 rounded-t-3xl shadow-lg border-slate-100">
           {!anonymized && !isScheduled ? (
             <AlertDialog>
               <AlertDialogTrigger asChild>
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
           <Button className="flex-1 rounded-2xl font-black shadow-xl shadow-primary/20" disabled={isScheduled || anonymized}>
              <Calendar className="h-4 w-4 mr-2" /> Programare
           </Button>
        </div>
      </div>
    </div>
  );
}
