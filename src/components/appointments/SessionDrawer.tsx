"use client";

import { useRef, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";
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
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";
import { toast } from "@/components/ui/toast";
import {
  RISK_LEVEL_BADGE_VARIANTS,
  RISK_LEVEL_LABELS,
  SERVICE_TYPE_LABELS,
  isRiskLevel,
  isServiceType,
} from "@/lib/clients/service-track";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [autoResult, setAutoResult] = useState<{
    invoiceId?: string;
    error?: string;
  } | null>(null);

  const location = deriveLocation(appointment);
  const LocIcon = locationIcon[location];
  const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];
  const serviceType = appointment.client?.service_type;
  const serviceTypeLabel =
    serviceType && isServiceType(serviceType) ? SERVICE_TYPE_LABELS[serviceType] : null;
  const riskLevel = appointment.client?.risk_level;
  const riskLabel = riskLevel && isRiskLevel(riskLevel) ? RISK_LEVEL_LABELS[riskLevel] : null;
  const riskVariant = riskLevel && isRiskLevel(riskLevel) ? RISK_LEVEL_BADGE_VARIANTS[riskLevel] : null;
  const hasContract = Boolean(
    appointment.client?.contract_url || appointment.client?.terms_consent_signed_at,
  );
  const hasDiaryCardThisWeek = appointment.hasDiaryCardThisWeek ?? null;

  function handleClose() {
    router.push(closeUrl);
  }

  useOverlayA11y({
    open: true,
    onClose: handleClose,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
  });

  function handleStatusChange(newStatus: AppointmentStatus) {
    startTransition(async () => {
      const result = await updateStatusInline(appointment.id, newStatus);
      if (result.ok) {
        setAutoResult({
          invoiceId: result.autoInvoiceId,
          error: result.autoInvoiceError,
        });
        const labels: Record<AppointmentStatus, string> = {
          PROGRAMAT: "Programare reactivată.",
          CONFIRMAT: "Programare confirmată.",
          FINALIZAT: "Ședință marcată finalizată.",
          ANULAT: "Programare anulată.",
          LIPSA: "Absență înregistrată.",
        };
        toast.success(labels[newStatus] ?? "Status actualizat.");
        router.refresh();
        if (newStatus === "FINALIZAT" && result.autoInvoiceId) {
          setActiveTab("invoice");
        }
      } else {
        toast.error(result.error ?? "Nu am putut actualiza statusul programării.");
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={handleClose}
        aria-label="Închide"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-drawer-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-4">
          <div className="min-w-0 flex-1">
            <h2 id="session-drawer-title" className="truncate text-base font-semibold">
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
          <button
            ref={closeButtonRef}
            type="button"
            className="ml-3 rounded-sm p-1 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            aria-label="Închide panoul sesiunii"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(["details", "note", "invoice", "config"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
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

              {!appointment.is_external_duty && appointment.client && (
                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Context clinic
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {serviceTypeLabel ?? "Tip de serviciu neconfigurat"}
                      </p>
                    </div>
                    {riskLabel && riskVariant ? (
                      <Badge variant={riskVariant}>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {riskLabel}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={hasContract ? "success" : "warning"}>
                      {hasContract ? "Contract disponibil" : "Contract lipsă"}
                    </Badge>
                    <Badge variant={hasNote ? "success" : "warning"}>
                      {hasNote ? "Notă existentă" : "Notă lipsă"}
                    </Badge>
                    <Badge variant={invoice ? "info" : "outline"}>
                      {invoice ? "Factură emisă" : "Fără factură"}
                    </Badge>
                    {serviceType === "DBT" ? (
                      <Badge variant={hasDiaryCardThisWeek ? "success" : "warning"}>
                        {hasDiaryCardThisWeek ? "Diary card prezent" : "Diary card lipsă"}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {appointment.client.contract_url ? (
                      <a
                        href={appointment.client.contract_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Deschide contract
                      </a>
                    ) : (
                      <Link
                        href={`/dashboard/clients/${appointment.client.id}`}
                        className="text-primary hover:underline"
                      >
                        Completează contract
                      </Link>
                    )}
                    {serviceType === "DBT" ? (
                      <Link
                        href={`/dashboard/clients/${appointment.client.id}`}
                        className="text-primary hover:underline"
                      >
                        {hasDiaryCardThisWeek ? "Vezi diary cards" : "Adaugă diary card"}
                      </Link>
                    ) : null}
                    <Link
                      href={`/dashboard/clients/${appointment.client.id}`}
                      className="text-primary hover:underline"
                    >
                      Context client
                    </Link>
                  </div>
                </div>
              )}

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
                  Notele sunt protejate prin criptare locală și necesită PIN
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Etichetă Locație</p>
                  <div className="flex gap-2">
                    {[null, "#cabinet", "#Clinica"].map((tag) => (
                      <button
                        key={String(tag)}
                        type="button"
                        onClick={() => startTransition(() => {
                          void updateAppointmentFields(appointment.id, { location_tag: tag });
                        })}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                          appointment.location_tag === tag 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                            : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-card hover:border-border"
                        )}
                      >
                        {tag === null ? "Fără" : tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Note Personale (Private)</p>
                  <textarea
                    defaultValue={appointment.personal_notes || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (appointment.personal_notes || "")) {
                         startTransition(() => {
                           void updateAppointmentFields(appointment.id, { personal_notes: e.target.value });
                         });
                      }
                    }}
                    placeholder="Note doar pentru tine..."
                    className="min-h-[100px] w-full rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs font-medium outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notificări App</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startTransition(() => {
                        void updateAppointmentFields(appointment.id, { reminders_enabled: !appointment.reminders_enabled });
                      })}
                      className={cn(
                        "h-5 w-10 rounded-full transition-all relative",
                        appointment.reminders_enabled ? "bg-emerald-500" : "bg-slate-300"
                      )}
                      aria-pressed={Boolean(appointment.reminders_enabled)}
                      aria-label={appointment.reminders_enabled ? "Dezactivează notificările aplicației" : "Activează notificările aplicației"}
                    >
                      <div className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                        appointment.reminders_enabled ? "left-5.5" : "left-0.5"
                      )} />
                    </button>
                  </div>
                  
                  {appointment.reminders_enabled && (
                    <div className="flex items-center justify-between border-t border-border/60 pt-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Trimite cu</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          defaultValue={appointment.reminder_minutes || 60}
                          onBlur={(e) => startTransition(() => {
                            void updateAppointmentFields(appointment.id, { reminder_minutes: parseInt(e.target.value) });
                          })}
                          className="h-8 w-12 rounded-lg border border-border/60 bg-card text-center text-xs font-bold font-mono outline-none"
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">min înainte</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4">
                 <p className="text-[10px] font-bold leading-relaxed italic text-muted-foreground">
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
