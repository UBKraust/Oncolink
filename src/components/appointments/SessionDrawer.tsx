"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, format } from "date-fns";
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
  toDatetimeLocalValue,
} from "@/lib/appointments/helpers";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
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
type DrawerNextAction = {
  title: string;
  description: string;
  cta: string;
  action?: "confirm" | "reschedule";
  href?: string;
};
type OperationalTimelineEntry = {
  timestampLabel: string;
  summary: string;
  followUpLabel?: string;
};
type QuickWorkflowAction = "reconfirm" | "cancel" | "no-show" | "follow-up";

const QUICK_ACTION_REASON_PRESETS: Record<QuickWorkflowAction, string[]> = {
  reconfirm: [
    "Confirmat telefonic.",
    "Confirmat prin mesaj.",
    "Clientul a reconfirmat ora.",
  ],
  cancel: [
    "Clientul a cerut anularea.",
    "Anulare din motiv medical.",
    "Anulare din conflict de program.",
  ],
  "no-show": [
    "Clientul nu s-a prezentat.",
    "Nu a răspuns la apelul de confirmare.",
    "Absență fără notificare prealabilă.",
  ],
  "follow-up": [
    "Follow-up reprogramat.",
    "Continuare de parcurs clinic.",
    "Ședință mutată pentru o nouă disponibilitate.",
  ],
};

const QUICK_ACTION_LABELS: Record<QuickWorkflowAction, string> = {
  reconfirm: "Reconfirmă",
  cancel: "Anulează",
  "no-show": "Marchează lipsă",
  "follow-up": "Mută pe follow-up",
};

interface SessionDrawerProps {
  appointment: AppointmentWithClient;
  invoice:
    | {
        id: string;
        status: string | null;
        amount: number | null;
        smartbill_series: string | null;
        smartbill_number: string | null;
      }
    | null;
  hasNote: boolean;
  closeUrl: string;
  onClose?: () => void;
  onAppointmentUpdate?: (payload: {
    id: string;
    patch: Partial<AppointmentWithClient>;
    autoInvoiceId?: string;
  }) => void;
}

export function SessionDrawer({
  appointment,
  invoice,
  hasNote,
  closeUrl,
  onClose,
  onAppointmentUpdate,
}: SessionDrawerProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [openedAt] = useState(() => Date.now());
  const [autoResult, setAutoResult] = useState<{
    invoiceId?: string;
    error?: string;
  } | null>(null);
  const [workflowAction, setWorkflowAction] = useState<QuickWorkflowAction | null>(null);
  const [workflowReason, setWorkflowReason] = useState("");
  const [workflowFollowUpValue, setWorkflowFollowUpValue] = useState(() =>
    toDatetimeLocalValue(addDays(new Date(appointment.appointment_date), 7).toISOString()),
  );
  const [rescheduleValue, setRescheduleValue] = useState(() =>
    toDatetimeLocalValue(appointment.appointment_date),
  );

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
  const isInPast = new Date(appointment.appointment_date).getTime() < openedAt;
  const operationalTimeline = parseOperationalTimeline(appointment.personal_notes);
  const nextBestAction = getNextBestAction({
    appointment,
    hasContract,
    hasDiaryCardThisWeek,
    hasNote,
    invoice,
    isInPast,
  });

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    router.push(closeUrl);
  }

  useOverlayA11y({
    open: true,
    onClose: handleClose,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
  });

  function primeWorkflowAction(nextAction: QuickWorkflowAction) {
    setWorkflowAction(nextAction);
    setWorkflowReason(QUICK_ACTION_REASON_PRESETS[nextAction][0] ?? "");
  }

  function resetWorkflowAction() {
    setWorkflowAction(null);
    setWorkflowReason("");
  }

  function handleInlineUpdate(
    data: {
      appointment_date?: string;
      status?: AppointmentStatus;
      location_tag?: string | null;
      personal_notes?: string | null;
      reminder_minutes?: number | null;
      reminders_enabled?: boolean;
    },
    options: {
      successMessage: string;
      patch?: Partial<AppointmentWithClient>;
      onSuccess?: () => void;
    },
  ) {
    startTransition(async () => {
      const result = await updateAppointmentFields(appointment.id, data);

      if (!result.ok) {
        toast.error(result.error ?? "Nu am putut salva modificarea.");
        return;
      }

      toast.success(options.successMessage);
      onAppointmentUpdate?.({
        id: appointment.id,
        patch:
          options.patch ??
          ({
            ...(data.status ? { status: data.status } : {}),
            ...(data.appointment_date
              ? { appointment_date: new Date(data.appointment_date).toISOString() }
              : {}),
            ...(data.location_tag !== undefined ? { location_tag: data.location_tag } : {}),
            ...(data.personal_notes !== undefined
              ? { personal_notes: data.personal_notes }
              : {}),
            ...(data.reminders_enabled !== undefined
              ? { reminders_enabled: data.reminders_enabled }
              : {}),
            ...(data.reminder_minutes !== undefined
              ? { reminder_minutes: data.reminder_minutes }
              : {}),
          } satisfies Partial<AppointmentWithClient>),
      });

      if (!onAppointmentUpdate) {
        router.refresh();
      }

      options.onSuccess?.();
    });
  }

  function buildOperationalNote(reason: string, followUpDate?: string) {
    const parts = [
      `[Flux programare · ${format(new Date(openedAt), "d MMM yyyy HH:mm", { locale: ro })}]`,
      reason.trim(),
    ].filter(Boolean);

    if (followUpDate) {
      parts.push(
        `Follow-up setat pentru ${format(new Date(followUpDate), "d MMM yyyy HH:mm", {
          locale: ro,
        })}.`,
      );
    }

    const noteLine = parts.join(" ");
    return appointment.personal_notes?.trim()
      ? `${appointment.personal_notes.trim()}\n${noteLine}`
      : noteLine;
  }

  function handleWorkflowActionSubmit(nextAction: QuickWorkflowAction) {
    const trimmedReason = workflowReason.trim();
    const fallbackReason = QUICK_ACTION_REASON_PRESETS[nextAction][0] ?? "";
    const finalReason = trimmedReason || fallbackReason;

    if (!finalReason) {
      toast.error("Adaugă un motiv scurt pentru această acțiune.");
      return;
    }

    if (nextAction === "follow-up") {
      const nextNotes = buildOperationalNote(finalReason, workflowFollowUpValue);
      handleInlineUpdate(
        {
          appointment_date: workflowFollowUpValue,
          status: "PROGRAMAT",
          personal_notes: nextNotes,
        },
        {
          successMessage: "Programarea a fost mutată pe follow-up.",
          patch: {
            appointment_date: new Date(workflowFollowUpValue).toISOString(),
            status: "PROGRAMAT",
            personal_notes: nextNotes,
          },
          onSuccess: resetWorkflowAction,
        },
      );
      return;
    }

    const nextStatus: AppointmentStatus =
      nextAction === "reconfirm"
        ? "CONFIRMAT"
        : nextAction === "cancel"
          ? "ANULAT"
          : "LIPSA";
    const nextNotes = buildOperationalNote(finalReason);

    handleInlineUpdate(
      {
        status: nextStatus,
        personal_notes: nextNotes,
      },
      {
        successMessage:
          nextAction === "reconfirm"
            ? "Reconfirmarea a fost salvată."
            : nextAction === "cancel"
              ? "Anularea a fost salvată."
              : "Absența a fost înregistrată.",
        patch: {
          status: nextStatus,
          personal_notes: nextNotes,
        },
        onSuccess: resetWorkflowAction,
      },
    );
  }

  function handleStatusChange(newStatus: AppointmentStatus) {
    startTransition(async () => {
      const statusReasonLabels: Record<AppointmentStatus, string> = {
        PROGRAMAT: "Programarea a fost reactivată din drawer.",
        CONFIRMAT: "Programarea a fost confirmată din drawer.",
        FINALIZAT: "Ședința a fost marcată finalizată din drawer.",
        ANULAT: "Programarea a fost anulată din drawer.",
        LIPSA: "Programarea a fost marcată ca absență din drawer.",
      };
      const nextNotes = buildOperationalNote(statusReasonLabels[newStatus] ?? "Status actualizat.");
      const result = await updateStatusInline(appointment.id, newStatus, nextNotes);
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
        onAppointmentUpdate?.({
          id: appointment.id,
          patch: {
            status: newStatus,
            personal_notes: nextNotes,
          },
          autoInvoiceId: result.autoInvoiceId,
        });
        if (!onAppointmentUpdate) {
          router.refresh();
        }
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
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Închide"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-drawer-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 bg-muted/20 p-5">
          <div className="min-w-0 flex-1">
            <h2 id="session-drawer-title" className="truncate text-lg font-black tracking-tight">
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
            className="ml-3 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleClose}
            aria-label="Închide panoul sesiunii"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/70 bg-background">
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
        <div className="flex-1 overflow-y-auto p-5">
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
                        {hasDiaryCardThisWeek ? "Jurnal DBT prezent" : "Jurnal DBT lipsă"}
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
                        {hasDiaryCardThisWeek ? "Vezi jurnalele DBT" : "Adaugă jurnal DBT"}
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

              {!appointment.is_external_duty && appointment.client && nextBestAction ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                    Următorul pas recomandat
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {nextBestAction.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {nextBestAction.description}
                  </p>
                  <div className="mt-3">
                    {nextBestAction.href ? (
                      <Button asChild size="sm" className="w-full">
                        <Link href={nextBestAction.href}>{nextBestAction.cta}</Link>
                      </Button>
                    ) : nextBestAction.action === "confirm" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => handleStatusChange("CONFIRMAT")}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {nextBestAction.cta}
                      </Button>
                    ) : nextBestAction.action === "reschedule" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab("config")}
                      >
                        {nextBestAction.cta}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!appointment.is_external_duty && appointment.client ? (
                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Acțiuni rapide
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Marchează rapid excepțiile de flux și lasă motivul în contextul intern al programării.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(["reconfirm", "cancel", "no-show", "follow-up"] as QuickWorkflowAction[]).map(
                      (quickAction) => (
                        <button
                          key={quickAction}
                          type="button"
                          onClick={() => primeWorkflowAction(quickAction)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                            workflowAction === quickAction
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-muted/30",
                          )}
                        >
                          {QUICK_ACTION_LABELS[quickAction]}
                        </button>
                      ),
                    )}
                  </div>

                  {workflowAction ? (
                    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {QUICK_ACTION_LABELS[workflowAction]}
                        </p>
                        <button
                          type="button"
                          onClick={resetWorkflowAction}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Închide
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {QUICK_ACTION_REASON_PRESETS[workflowAction].map((reasonPreset) => (
                          <button
                            key={reasonPreset}
                            type="button"
                            onClick={() => setWorkflowReason(reasonPreset)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                              workflowReason === reasonPreset
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {reasonPreset}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={workflowReason}
                        onChange={(e) => setWorkflowReason(e.target.value)}
                        placeholder="Scrie motivul scurt pentru această acțiune..."
                        className="min-h-[88px] w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-sm outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/20"
                      />

                      {(workflowAction === "no-show" || workflowAction === "cancel" || workflowAction === "follow-up") ? (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Timeline follow-up
                          </p>
                          <input
                            type="datetime-local"
                            value={workflowFollowUpValue}
                            onChange={(e) => setWorkflowFollowUpValue(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border/60 bg-muted/20 px-3 text-sm outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/20"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending || !workflowFollowUpValue}
                            onClick={() => handleWorkflowActionSubmit("follow-up")}
                          >
                            {isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CalendarClock className="mr-2 h-4 w-4" />
                            )}
                            Mută direct pe follow-up
                          </Button>
                        </div>
                      ) : null}

                      <Button
                        type="button"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => handleWorkflowActionSubmit(workflowAction)}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Salvează acțiunea
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {operationalTimeline.length > 0 ? (
                <div className="space-y-3 rounded-lg border border-border/70 bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Timeline operațional
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ultimele decizii din fluxul acestei programări.
                      </p>
                    </div>
                    <Badge variant="outline">{operationalTimeline.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {operationalTimeline.map((entry, index) => (
                      <div
                        key={`${entry.timestampLabel}-${index}`}
                        className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                      >
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0 space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                            {entry.timestampLabel}
                          </p>
                          <p className="text-sm text-foreground">{entry.summary}</p>
                          {entry.followUpLabel ? (
                            <p className="text-xs text-muted-foreground">
                              {entry.followUpLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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
                        {invoice.smartbill_series && invoice.smartbill_number
                          ? `${invoice.smartbill_series}/${invoice.smartbill_number}`
                          : "Factură emisă"}
                      </span>
                      {invoice.status ? (
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
                      ) : null}
                    </div>
                    {invoice.amount !== null ? (
                      <p className="text-muted-foreground">{invoice.amount} RON</p>
                    ) : null}
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
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Reprogramează
                    </p>
                  </div>
                  <input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(e) => setRescheduleValue(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/60 bg-card px-3 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isPending || !rescheduleValue}
                    onClick={() =>
                      handleInlineUpdate(
                        { appointment_date: rescheduleValue, status: "PROGRAMAT" },
                        {
                          successMessage: "Programarea a fost reprogamată.",
                          patch: {
                            appointment_date: new Date(rescheduleValue).toISOString(),
                            status: "PROGRAMAT",
                          },
                        },
                      )
                    }
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarClock className="mr-2 h-4 w-4" />
                    )}
                    Salvează noua dată
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Etichetă Locație</p>
                  <div className="flex gap-2">
                    {[null, "#cabinet", "#Clinica"].map((tag) => (
                      <button
                        key={String(tag)}
                        type="button"
                        onClick={() =>
                          handleInlineUpdate(
                            { location_tag: tag },
                            {
                              successMessage: "Locația a fost actualizată.",
                              patch: { location_tag: tag },
                            },
                          )
                        }
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
                        handleInlineUpdate(
                          { personal_notes: e.target.value },
                          {
                            successMessage: "Notele personale au fost salvate.",
                            patch: { personal_notes: e.target.value },
                          },
                        );
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
                      onClick={() =>
                        handleInlineUpdate(
                          { reminders_enabled: !appointment.reminders_enabled },
                          {
                            successMessage: appointment.reminders_enabled
                              ? "Notificările au fost oprite."
                              : "Notificările au fost activate.",
                            patch: {
                              reminders_enabled: !appointment.reminders_enabled,
                            },
                          },
                        )
                      }
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
                          onBlur={(e) => {
                            const nextMinutes = Number.parseInt(e.target.value, 10);
                            if (Number.isNaN(nextMinutes)) return;
                            handleInlineUpdate(
                              { reminder_minutes: nextMinutes },
                              {
                                successMessage: "Intervalul de reminder a fost actualizat.",
                                patch: { reminder_minutes: nextMinutes },
                              },
                            );
                          }}
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
        <div className="border-t border-border/70 bg-background p-4">
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

function getNextBestAction({
  appointment,
  hasContract,
  hasDiaryCardThisWeek,
  hasNote,
  invoice,
  isInPast,
}: {
  appointment: AppointmentWithClient;
  hasContract: boolean;
  hasDiaryCardThisWeek: boolean | null;
  hasNote: boolean;
  invoice:
    | {
        id: string;
        status: string | null;
        amount: number | null;
        smartbill_series: string | null;
        smartbill_number: string | null;
      }
    | null;
  isInPast: boolean;
}): DrawerNextAction | null {
  if (appointment.status === "PROGRAMAT" && isInPast) {
    return {
      title: "Clarifică programarea ratată",
      description:
        "Ora ședinței a trecut, dar sesiunea este încă programată. Reprogramează sau marchează absența din drawer.",
      cta: "Reprogramează acum",
      action: "reschedule",
    };
  }

  if (appointment.status === "PROGRAMAT") {
    return {
      title: "Confirmă prezența",
      description:
        "Acesta este următorul pas natural înainte de ședință, ca agenda de azi să rămână curată și predictibilă.",
      cta: "Marchează confirmat",
      action: "confirm",
    };
  }

  if (appointment.status === "CONFIRMAT" && !hasContract && appointment.client) {
    return {
      title: "Completează baza contractuală",
      description:
        "Ședința este confirmată, dar dosarul clientului nu are contract sau consimțământ complet.",
      cta: "Deschide clientul",
      href: `/dashboard/clients/${appointment.client.id}`,
    };
  }

  if (appointment.status === "FINALIZAT" && !hasNote) {
    return {
      title: "Documentează ședința",
      description:
        "După finalizare, terapeutul are nevoie de nota clinică înainte să piardă contextul sesiunii.",
      cta: "Creează nota",
      href: `/dashboard/notes/${appointment.id}`,
    };
  }

  if (appointment.status === "FINALIZAT" && hasNote && !invoice) {
    return {
      title: "Emite factura",
      description:
        "Sesiunea este închisă clinic, dar fluxul administrativ nu este complet fără factura asociată.",
      cta: "Deschide factura",
      href: `/dashboard/invoices/new?appointmentId=${appointment.id}`,
    };
  }

  if (appointment.client?.service_type === "DBT" && !hasDiaryCardThisWeek && appointment.client) {
    return {
      title: "Verifică jurnalul DBT",
      description:
        "Pentru acest client nu apare un jurnal în săptămâna curentă, deci merită verificat înainte de următoarea ședință.",
      cta: "Vezi context client",
      href: `/dashboard/clients/${appointment.client.id}`,
    };
  }

  return {
    title: "Fluxul acestei ședințe este acoperit",
    description:
      "Nu există un blocaj operațional evident. Poți continua din drawer sau deschide pagina completă doar dacă ai nevoie de context extins.",
    cta: appointment.client ? "Deschide clientul" : "Rămâi în detalii",
    href: appointment.client ? `/dashboard/clients/${appointment.client.id}` : undefined,
  };
}

function parseOperationalTimeline(notes: string | null | undefined): OperationalTimelineEntry[] {
  if (!notes?.trim()) return [];

  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^\[Flux programare · ([^\]]+)\]\s*(.*)$/);
      if (!match) return [];

      const [, timestampLabel, rawContent] = match;
      const followUpMatch = rawContent.match(/(.*?)(Follow-up setat pentru .*)$/);

      if (followUpMatch) {
        const summary = followUpMatch[1]?.trim() || "Acțiune operațională salvată.";
        const followUpLabel = followUpMatch[2]?.trim() || undefined;
        return [{ timestampLabel, summary, followUpLabel }];
      }

      return [
        {
          timestampLabel,
          summary: rawContent.trim() || "Acțiune operațională salvată.",
        },
      ];
    })
    .reverse();
}
