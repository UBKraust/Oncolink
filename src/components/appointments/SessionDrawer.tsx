"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Home,
  Loader2,
  NotebookPen,
  Receipt,
  Settings,
  User,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import type { InvoiceRow } from "@/lib/invoices/queries";
import { updateStatusInline, updateAppointmentFields } from "@/app/dashboard/appointments/session-actions";
import type { AppointmentStatus } from "@/lib/appointments/helpers";

const STATUS_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  PROGRAMAT: ["CONFIRMAT", "ANULAT"],
  CONFIRMAT: ["FINALIZAT", "LIPSA", "ANULAT"],
  FINALIZAT: [],
  ANULAT: ["PROGRAMAT"],
  LIPSA: ["PROGRAMAT"],
};

const locationIcon = {
  PRIVAT: Home,
  POLICLINIC: Building2,
  ONLINE: Video,
  CABINET: Home,
  CLINICA: Building2,
} as const;

type Tab = "details" | "note" | "invoice" | "config";

interface SessionDrawerProps {
  appointment: AppointmentWithClient;
  invoice: InvoiceRow | null;
  hasNote: boolean;
  closeUrl: string;
}

export function SessionDrawer({
  appointment,
  invoice,
  hasNote,
  closeUrl,
}: SessionDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [autoResult, setAutoResult] = useState<{
    invoiceId?: string;
    error?: string;
  } | null>(null);

  const location = deriveLocation(appointment);
  const LocIcon = locationIcon[location];
  const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];

  function handleStatusChange(newStatus: AppointmentStatus) {
    startTransition(async () => {
      const result = await updateStatusInline(appointment.id, newStatus);
      if (result.ok) {
        setAutoResult({
          invoiceId: result.autoInvoiceId,
          error: result.autoInvoiceError,
        });
        router.refresh();
        if (newStatus === "FINALIZAT" && result.autoInvoiceId) {
          setActiveTab("invoice");
        }
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <Link
        href={closeUrl}
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Închide"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b p-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">
              {appointment.is_external_duty
                ? "Gardă externă"
                : (appointment.client?.full_name ?? "—")}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {format(
                new Date(appointment.appointment_date),
                "EEEE, d MMM yyyy · HH:mm",
                { locale: ro },
              )}
              {" · "}
              {appointment.duration_minutes} min
            </p>
            <div className="mt-1.5">
              <Badge
                variant={
                  statusVariant[
                    appointment.status as keyof typeof statusVariant
                  ]
                }
              >
                {statusLabel[appointment.status as keyof typeof statusLabel] ??
                  appointment.status}
              </Badge>
            </div>
          </div>
          <Link
            href={closeUrl}
            className="ml-3 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Închide</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(["details", "note", "invoice"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "details"
                ? "Detalii"
                : tab === "note"
                  ? "Notă"
                  : tab === "invoice"
                    ? "Factură"
                    : "Config"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── DETALII ── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {format(
                      new Date(appointment.appointment_date),
                      "EEEE, d MMMM yyyy HH:mm",
                      { locale: ro },
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{appointment.duration_minutes} minute</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <LocIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{locationLabel[location]}</span>
                </div>
                {appointment.client && (
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Link
                      href={`/dashboard/clients/${appointment.client.id}`}
                      className="text-primary hover:underline"
                    >
                      {appointment.client.full_name}
                    </Link>
                  </div>
                )}
                {appointment.meet_link && (
                  <a
                    href={appointment.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-primary hover:underline"
                  >
                    <Video className="h-4 w-4 shrink-0" />
                    Deschide Meet
                  </a>
                )}
              </div>

              {/* Status transitions */}
              {transitions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Schimbă status
                  </p>
                  {transitions.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleStatusChange(s)}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-3.5 w-3.5" />
                      )}
                      → {statusLabel[s]}
                    </Button>
                  ))}
                </div>
              )}

              {/* Auto-invoice feedback */}
              {autoResult?.invoiceId && (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Factură emisă automat.{" "}
                    <Link
                      href={`/dashboard/invoices/${autoResult.invoiceId}`}
                      className="underline"
                    >
                      Vezi factura
                    </Link>
                  </span>
                </div>
              )}
              {autoResult?.error && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{autoResult.error}</span>
                </div>
              )}

              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
                  Editează programarea
                </Link>
              </Button>
            </div>
          )}

          {/* ── NOTĂ ── */}
          {activeTab === "note" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 text-sm">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {hasNote
                      ? "Notă clinică existentă"
                      : "Nicio notă pentru această ședință"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Notele sunt criptate end-to-end (AES-256) și necesită PIN
                  pentru acces.
                </p>
              </div>
              {!appointment.is_external_duty && (
                <Button
                  asChild
                  className="w-full"
                  variant={hasNote ? "outline" : "default"}
                >
                  <Link href={`/dashboard/notes/${appointment.id}`}>
                    <NotebookPen className="mr-2 h-4 w-4" />
                    {hasNote ? "Editează nota" : "Creează notă"}
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* ── FACTURĂ ── */}
          {activeTab === "invoice" && (
            <div className="space-y-4">
              {invoice ? (
                <div className="space-y-3">
                  <div className="space-y-2 rounded-lg border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {invoice.smartbill_series}/{invoice.smartbill_number}
                      </span>
                      <Badge
                        variant={
                          invoice.status === "PLĂTITĂ"
                            ? "success"
                            : invoice.status === "ANULATĂ"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {invoice.amount} RON
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Deschide factura
                    </Link>
                  </Button>
                </div>
              ) : appointment.status === "FINALIZAT" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nicio factură emisă pentru această ședință.
                  </p>
                  <Button asChild className="w-full">
                    <Link
                      href={`/dashboard/invoices/new?appointmentId=${appointment.id}`}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Emite factură
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p>
                    Factura se poate emite după ce ședința este marcată ca{" "}
                    <strong>Finalizată</strong>.
                  </p>
                  <p className="mt-1 text-xs">
                    Marchează ca Finalizat din tab-ul Detalii.
                  </p>
                </div>
              )}
            </div>
          )}
          {/* ── CONFIGURARE ── */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etichetă Locație</p>
                  <div className="flex gap-2">
                    {[null, "#cabinet", "#Clinica"].map((tag) => (
                      <button
                        key={String(tag)}
                        onClick={() => startTransition(() => updateAppointmentFields(appointment.id, { location_tag: tag }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                          appointment.location_tag === tag 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-slate-300"
                        )}
                      >
                        {tag === null ? "Fără" : tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Note Personale (Private)</p>
                  <textarea
                    defaultValue={appointment.personal_notes || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (appointment.personal_notes || "")) {
                         startTransition(() => updateAppointmentFields(appointment.id, { personal_notes: e.target.value }));
                      }
                    }}
                    placeholder="Note doar pentru tine..."
                    className="w-full min-h-[100px] rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notificări App</p>
                    </div>
                    <button
                      onClick={() => startTransition(() => updateAppointmentFields(appointment.id, { reminders_enabled: !appointment.reminders_enabled }))}
                      className={cn(
                        "h-5 w-10 rounded-full transition-all relative",
                        appointment.reminders_enabled ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                        appointment.reminders_enabled ? "left-5.5" : "left-0.5"
                      )} />
                    </button>
                  </div>
                  
                  {appointment.reminders_enabled && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Trimite cu</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          defaultValue={appointment.reminder_minutes || 60}
                          onBlur={(e) => startTransition(() => updateAppointmentFields(appointment.id, { reminder_minutes: parseInt(e.target.value) }))}
                          className="w-12 h-8 rounded-lg bg-white border border-slate-200 text-center text-xs font-bold font-mono outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">min înainte</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed p-4 bg-slate-50/50">
                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                   💡 Notele personale și etichetele sunt vizibile doar în calendarul tău și nu sunt partajate cu pacientul sau trimise către Google Calendar.
                 </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <Link
            href={`/dashboard/appointments/${appointment.id}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Deschide pagina completă
          </Link>
        </div>
      </div>
    </>
  );
}
