"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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

import { ServiceTrackCard } from "@/components/clients/ServiceTrackCard";
import { DocumentRequirementsCard } from "@/components/clients/DocumentRequirementsCard";
import { ClinicalContextCard } from "@/components/clients/ClinicalContextCard";
import { HomeworkCard } from "@/components/clients/HomeworkCard";
import { SafetyPlanCard } from "@/components/clients/SafetyPlanCard";
import { CbtCaseFormulationCard } from "@/components/clients/CbtCaseFormulationCard";
import { CbtProgressCard } from "@/components/clients/CbtProgressCard";
import { DbtDiaryCardsPanel } from "@/components/clients/DbtDiaryCardsPanel";
import { AnamnesisCard } from "@/components/clients/AnamnesisCard";
import { ClinicalInterviewCard } from "@/components/clients/ClinicalInterviewCard";
import { RiskAssessmentCard } from "@/components/clients/RiskAssessmentCard";
import { DbtCommitmentCard } from "@/components/clients/DbtCommitmentCard";
import { DbtProgressCard } from "@/components/clients/DbtProgressCard";
import { CounselingPlanCard } from "@/components/clients/CounselingPlanCard";
import { CounselingProgressCard } from "@/components/clients/CounselingProgressCard";
import { RecommendationsCard } from "@/components/clients/RecommendationsCard";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_BADGE_VARIANTS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_BADGE_VARIANTS,
  isRiskLevel,
  isServiceType,
} from "@/lib/clients/service-track";
import type {
  ClientAiContext,
  ClientAccessHistoryItem,
  ClientAppointment,
  ClientAssessment,
  ClientDocument,
  ClientMedication,
  ClientPayment,
  ClientProfile,
  ClientStatusHistoryItem,
  CrisisNoteItem,
  WidgetCardProps,
  HomeworkItem,
  CbtCaseFormulation,
  DbtDiaryCard,
  SafetyPlan,
} from "@/components/clients/types";
import { Skeleton } from "@/components/ui/skeleton";

const ClientEvolutionChart = dynamic(
  () => import("@/components/clients/ClientEvolutionChart").then((mod) => mod.ClientEvolutionChart),
  {
    loading: () => <Skeleton className="h-[18rem] rounded-[2rem]" />,
  },
);

const ClientDriveDocuments = dynamic(
  () => import("@/components/clients/ClientDriveDocuments").then((mod) => mod.ClientDriveDocuments),
  {
    loading: () => <Skeleton className="h-[18rem] rounded-[2rem]" />,
  },
);

const ClientAiAssistant = dynamic(
  () => import("@/components/clients/ClientAiAssistant").then((mod) => mod.ClientAiAssistant),
  { ssr: false },
);

const PersonalInfoOverlay = dynamic(
  () => import("@/components/clients/PersonalInfoOverlay").then((mod) => mod.PersonalInfoOverlay),
);
const FinancialDetailOverlay = dynamic(
  () => import("@/components/clients/FinancialDetailOverlay").then((mod) => mod.FinancialDetailOverlay),
);
const MedicalDetailOverlay = dynamic(
  () => import("@/components/clients/MedicalDetailOverlay").then((mod) => mod.MedicalDetailOverlay),
);
const CrisisNotesDetailOverlay = dynamic(
  () => import("@/components/clients/CrisisNotesDetailOverlay").then((mod) => mod.CrisisNotesDetailOverlay),
);
const AssessmentDetailOverlay = dynamic(
  () => import("@/components/clients/AssessmentDetailOverlay").then((mod) => mod.AssessmentDetailOverlay),
);
const ContractGeneratorModal = dynamic(
  () => import("@/components/clients/ContractGeneratorModal").then((mod) => mod.ContractGeneratorModal),
);
const ClientEditOverlay = dynamic(
  () => import("@/components/clients/ClientEditOverlay").then((mod) => mod.ClientEditOverlay),
);

interface ClientDashboardUIProps {
  client: ClientProfile;
  assessments: ClientAssessment[];
  payments: ClientPayment[];
  clientDocs: ClientDocument[];
  clientMeds: ClientMedication[];
  crisisNotes: CrisisNoteItem[];
  medicationCount: number;
  crisisNotesCount: number;
  clinicDataPreloaded: boolean;
  appointments: ClientAppointment[];
  lifecycleHistory: ClientStatusHistoryItem[];
  accessHistory: ClientAccessHistoryItem[];
  lifecycleDataPreloaded: boolean;
  anonymized: boolean;
  justAnonymized: boolean;
  viewParam: string | undefined;
  sectionParam: string | undefined;
  assessmentParam: string | undefined;
  aiClientContext: ClientAiContext;
  // P2 clinical tools
  homeworkItems: HomeworkItem[];
  cbtFormulation: CbtCaseFormulation | null;
  dbtDiaryCards: DbtDiaryCard[];
  safetyPlan: SafetyPlan | null;
  // P3 clinical forms
  anamnesisForm: ClinicalFormRow | null;
  clinicalInterviewForm: ClinicalFormRow | null;
  riskAssessmentForm: ClinicalFormRow | null;
  dbtCommitmentForm: ClinicalFormRow | null;
  dbtProgressForm: ClinicalFormRow | null;
  cbtProgressForm: ClinicalFormRow | null;
  counselingPlanForm: ClinicalFormRow | null;
  recommendationsForm: ClinicalFormRow | null;
  counselingProgressForm: ClinicalFormRow | null;
}

type ClientOverviewSection = "contact" | "finance" | "medical" | "crisis";

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

type ClientWorkspaceView = "overview" | "clinic" | "appointments" | "lifecycle";

const WORKSPACE_VIEWS: Array<{ id: ClientWorkspaceView; label: string }> = [
  { id: "overview", label: "Sumar" },
  { id: "clinic", label: "Clinic" },
  { id: "appointments", label: "Programări" },
  { id: "lifecycle", label: "Lifecycle" },
];

function isClientOverviewSection(value: string | null | undefined): value is ClientOverviewSection {
  return value === "contact" || value === "finance" || value === "medical" || value === "crisis";
}

function resolveClientUiState(params: URLSearchParams) {
  const section = params.get("section");
  const assessment = params.get("assessment");
  const viewValue = params.get("view");
  const view: ClientWorkspaceView = assessment
    ? "clinic"
    : section
      ? "overview"
      : isClientWorkspaceView(viewValue ?? undefined)
        ? (viewValue as ClientWorkspaceView)
        : "overview";

  return {
    view,
    section: isClientOverviewSection(section) ? section : null,
    assessment: assessment ?? null,
  };
}

function isClientWorkspaceView(value: string | undefined): value is ClientWorkspaceView {
  return value === "overview" || value === "clinic" || value === "appointments" || value === "lifecycle";
}

export function ClientDashboardUI({
  client,
  assessments,
  payments,
  clientDocs,
  clientMeds,
  crisisNotes,
  medicationCount,
  crisisNotesCount,
  clinicDataPreloaded,
  appointments,
  lifecycleHistory,
  accessHistory,
  lifecycleDataPreloaded,
  anonymized,
  justAnonymized,
  viewParam,
  sectionParam,
  assessmentParam,
  aiClientContext,
  homeworkItems,
  cbtFormulation,
  dbtDiaryCards,
  safetyPlan,
  anamnesisForm,
  clinicalInterviewForm,
  riskAssessmentForm,
  dbtCommitmentForm,
  dbtProgressForm,
  cbtProgressForm,
  counselingPlanForm,
  recommendationsForm,
  counselingProgressForm,
}: ClientDashboardUIProps) {
  const router = useRouter();
  const [isLifecyclePending, startLifecycleTransition] = useTransition();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
  const [isCopyingOnboardingLink, setIsCopyingOnboardingLink] = useState(false);
  const initialClientUiState = resolveClientUiState(
    new URLSearchParams({
      ...(viewParam ? { view: viewParam } : {}),
      ...(sectionParam ? { section: sectionParam } : {}),
      ...(assessmentParam ? { assessment: assessmentParam } : {}),
    }),
  );
  const initialView = initialClientUiState.view;
  const [activeView, setActiveView] = useState<ClientWorkspaceView>(initialView);
  const [isTabPending, setIsTabPending] = useState(false);
  const [activeSection, setActiveSection] = useState<ClientOverviewSection | null>(initialClientUiState.section);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(initialClientUiState.assessment);
  const [assessmentsState, setAssessmentsState] = useState<ClientAssessment[]>(assessments);
  const [clientDocsState, setClientDocsState] = useState<ClientDocument[]>(clientDocs);
  const [clientMedsState, setClientMedsState] = useState<ClientMedication[]>(clientMeds);
  const [crisisNotesState, setCrisisNotesState] = useState<CrisisNoteItem[]>(crisisNotes);
  const [medicationCountState, setMedicationCountState] = useState(medicationCount);
  const [crisisNotesCountState, setCrisisNotesCountState] = useState(crisisNotesCount);
  const [homeworkItemsState, setHomeworkItemsState] = useState(homeworkItems);
  const [cbtFormulationState, setCbtFormulationState] = useState(cbtFormulation);
  const [dbtDiaryCardsState, setDbtDiaryCardsState] = useState(dbtDiaryCards);
  const [safetyPlanState, setSafetyPlanState] = useState(safetyPlan);
  const [anamnesisFormState, setAnamnesisFormState] = useState(anamnesisForm);
  const [clinicalInterviewFormState, setClinicalInterviewFormState] = useState(clinicalInterviewForm);
  const [riskAssessmentFormState, setRiskAssessmentFormState] = useState(riskAssessmentForm);
  const [dbtCommitmentFormState, setDbtCommitmentFormState] = useState(dbtCommitmentForm);
  const [dbtProgressFormState, setDbtProgressFormState] = useState(dbtProgressForm);
  const [cbtProgressFormState, setCbtProgressFormState] = useState(cbtProgressForm);
  const [counselingPlanFormState, setCounselingPlanFormState] = useState(counselingPlanForm);
  const [recommendationsFormState, setRecommendationsFormState] = useState(recommendationsForm);
  const [counselingProgressFormState, setCounselingProgressFormState] = useState(counselingProgressForm);
  const [hasLoadedClinicData, setHasLoadedClinicData] = useState(clinicDataPreloaded);
  const [isClinicDataLoading, setIsClinicDataLoading] = useState(false);
  const [lifecycleHistoryState, setLifecycleHistoryState] = useState<ClientStatusHistoryItem[]>(lifecycleHistory);
  const [accessHistoryState, setAccessHistoryState] = useState<ClientAccessHistoryItem[]>(accessHistory);
  const [hasLoadedLifecycleData, setHasLoadedLifecycleData] = useState(lifecycleDataPreloaded);
  const [isLifecycleDataLoading, setIsLifecycleDataLoading] = useState(false);
  const id = client.id;
  const isMinor = client.is_minor ?? false;
  const baseUrl = `/dashboard/clients/${id}`;
  const buildClientUrl = ({
    view = activeView,
    section,
    assessment,
  }: {
    view?: ClientWorkspaceView;
    section?: string | null;
    assessment?: string | null;
  } = {}) => {
    const params = new URLSearchParams();

    if (view !== "overview") {
      params.set("view", view);
    }
    if (section) {
      params.set("section", section);
    }
    if (assessment) {
      params.set("assessment", assessment);
    }

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };
  useEffect(() => {
    setActiveView(initialClientUiState.view);
    setActiveSection(initialClientUiState.section);
    setActiveAssessmentId(initialClientUiState.assessment);
  }, [initialClientUiState.assessment, initialClientUiState.section, initialClientUiState.view]);

  useEffect(() => {
    setAssessmentsState(assessments);
    setClientDocsState(clientDocs);
    setClientMedsState(clientMeds);
    setCrisisNotesState(crisisNotes);
    setMedicationCountState(clientMeds.length > 0 ? clientMeds.length : medicationCount);
    setCrisisNotesCountState(crisisNotes.length > 0 ? crisisNotes.length : crisisNotesCount);
    setHomeworkItemsState(homeworkItems);
    setCbtFormulationState(cbtFormulation);
    setDbtDiaryCardsState(dbtDiaryCards);
    setSafetyPlanState(safetyPlan);
    setAnamnesisFormState(anamnesisForm);
    setClinicalInterviewFormState(clinicalInterviewForm);
    setRiskAssessmentFormState(riskAssessmentForm);
    setDbtCommitmentFormState(dbtCommitmentForm);
    setDbtProgressFormState(dbtProgressForm);
    setCbtProgressFormState(cbtProgressForm);
    setCounselingPlanFormState(counselingPlanForm);
    setRecommendationsFormState(recommendationsForm);
    setCounselingProgressFormState(counselingProgressForm);
    setHasLoadedClinicData(clinicDataPreloaded);
  }, [
    assessments,
    cbtFormulation,
    cbtProgressForm,
    clinicDataPreloaded,
    clientDocs,
    clientMeds,
    clinicalInterviewForm,
    counselingPlanForm,
    counselingProgressForm,
    crisisNotes,
    crisisNotesCount,
    dbtCommitmentForm,
    dbtDiaryCards,
    dbtProgressForm,
    homeworkItems,
    medicationCount,
    recommendationsForm,
    riskAssessmentForm,
    safetyPlan,
    anamnesisForm,
  ]);

  useEffect(() => {
    setLifecycleHistoryState(lifecycleHistory);
    setAccessHistoryState(accessHistory);
    setHasLoadedLifecycleData(lifecycleDataPreloaded);
  }, [accessHistory, lifecycleDataPreloaded, lifecycleHistory]);

  useEffect(() => {
    if (!isTabPending) return;
    const timer = window.setTimeout(() => setIsTabPending(false), 220);
    return () => window.clearTimeout(timer);
  }, [isTabPending]);

  useEffect(() => {
    const needsClinicData =
      !anonymized &&
      (activeView === "clinic" || activeSection === "medical" || activeSection === "crisis" || Boolean(activeAssessmentId));
    if (!needsClinicData || hasLoadedClinicData || isClinicDataLoading) return;

    let cancelled = false;

    async function loadClinicData() {
      setIsClinicDataLoading(true);
      try {
        const response = await fetch(`/api/clients/${id}/clinical-workspace`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          assessments: ClientAssessment[];
          clientDocs: ClientDocument[];
          clientMeds: ClientMedication[];
          crisisNotes: CrisisNoteItem[];
          homeworkItems: HomeworkItem[];
          cbtFormulation: CbtCaseFormulation | null;
          dbtDiaryCards: DbtDiaryCard[];
          safetyPlan: SafetyPlan | null;
          anamnesisForm: ClinicalFormRow | null;
          clinicalInterviewForm: ClinicalFormRow | null;
          riskAssessmentForm: ClinicalFormRow | null;
          dbtCommitmentForm: ClinicalFormRow | null;
          dbtProgressForm: ClinicalFormRow | null;
          cbtProgressForm: ClinicalFormRow | null;
          counselingPlanForm: ClinicalFormRow | null;
          recommendationsForm: ClinicalFormRow | null;
          counselingProgressForm: ClinicalFormRow | null;
        };

        if (cancelled) return;
        setAssessmentsState(data.assessments);
        setClientDocsState(data.clientDocs);
        setClientMedsState(data.clientMeds);
        setCrisisNotesState(data.crisisNotes);
        setMedicationCountState(data.clientMeds.length);
        setCrisisNotesCountState(data.crisisNotes.length);
        setHomeworkItemsState(data.homeworkItems);
        setCbtFormulationState(data.cbtFormulation);
        setDbtDiaryCardsState(data.dbtDiaryCards);
        setSafetyPlanState(data.safetyPlan);
        setAnamnesisFormState(data.anamnesisForm);
        setClinicalInterviewFormState(data.clinicalInterviewForm);
        setRiskAssessmentFormState(data.riskAssessmentForm);
        setDbtCommitmentFormState(data.dbtCommitmentForm);
        setDbtProgressFormState(data.dbtProgressForm);
        setCbtProgressFormState(data.cbtProgressForm);
        setCounselingPlanFormState(data.counselingPlanForm);
        setRecommendationsFormState(data.recommendationsForm);
        setCounselingProgressFormState(data.counselingProgressForm);
        setHasLoadedClinicData(true);
      } catch (error) {
        if (!cancelled) {
          console.warn("[client-dashboard] clinical workspace fetch failed", error);
          toast.error("Nu am putut încărca workspace-ul clinic al clientului.");
        }
      } finally {
        if (!cancelled) setIsClinicDataLoading(false);
      }
    }

    void loadClinicData();

    return () => {
      cancelled = true;
    };
  }, [activeAssessmentId, activeSection, activeView, anonymized, hasLoadedClinicData, id, isClinicDataLoading]);

  useEffect(() => {
    if (activeView !== "lifecycle" || hasLoadedLifecycleData || isLifecycleDataLoading) return;

    let cancelled = false;

    async function loadLifecycleData() {
      setIsLifecycleDataLoading(true);
      try {
        const response = await fetch(`/api/clients/${id}/lifecycle-data`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          lifecycleHistory: ClientStatusHistoryItem[];
          accessHistory: ClientAccessHistoryItem[];
        };
        if (cancelled) return;
        setLifecycleHistoryState(data.lifecycleHistory);
        setAccessHistoryState(data.accessHistory);
        setHasLoadedLifecycleData(true);
      } catch (error) {
        if (!cancelled) {
          console.warn("[client-dashboard] lifecycle fetch failed", error);
          toast.error("Nu am putut încărca istoricul lifecycle pentru acest client.");
        }
      } finally {
        if (!cancelled) setIsLifecycleDataLoading(false);
      }
    }

    void loadLifecycleData();

    return () => {
      cancelled = true;
    };
  }, [activeView, hasLoadedLifecycleData, id, isLifecycleDataLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handlePopState() {
      const state = resolveClientUiState(new URLSearchParams(window.location.search));
      setActiveView(state.view);
      setActiveSection(state.section);
      setActiveAssessmentId(state.assessment);
      setIsTabPending(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleWorkspaceNavigation(view: ClientWorkspaceView) {
    const targetUrl = buildClientUrl({ view });
    if (targetUrl === buildClientUrl({ view: activeView }) || typeof window === "undefined") return;
    setActiveView(view);
    if (view !== "overview") {
      setActiveSection(null);
    }
    if (view !== "clinic") {
      setActiveAssessmentId(null);
    }
    setIsTabPending(true);
    window.history.pushState(window.history.state, "", targetUrl);
  }

  function updateBrowserUrl({
    view = activeView,
    section,
    assessment,
    mode = "push",
  }: {
    view?: ClientWorkspaceView;
    section?: ClientOverviewSection | null;
    assessment?: string | null;
    mode?: "push" | "replace";
  }) {
    if (typeof window === "undefined") return;
    const nextUrl = buildClientUrl({ view, section: section ?? null, assessment: assessment ?? null });
    const historyMethod = mode === "replace" ? "replaceState" : "pushState";
    window.history[historyMethod](window.history.state, "", nextUrl);
  }

  function openSection(section: ClientOverviewSection) {
    setActiveView("overview");
    setActiveSection(section);
    setActiveAssessmentId(null);
    updateBrowserUrl({ view: "overview", section, assessment: null });
  }

  function closeSectionOverlay() {
    setActiveSection(null);
    updateBrowserUrl({
      view: activeView,
      section: null,
      assessment: activeView === "clinic" ? activeAssessmentId : null,
      mode: "replace",
    });
  }

  function openAssessment(assessmentId: string) {
    setActiveView("clinic");
    setActiveAssessmentId(assessmentId);
    setActiveSection(null);
    updateBrowserUrl({ view: "clinic", assessment: assessmentId, section: null });
  }

  function closeAssessmentOverlay() {
    setActiveAssessmentId(null);
    updateBrowserUrl({ view: "clinic", assessment: null, section: null, mode: "replace" });
  }
  const lifecycle = deriveClientLifecycle(client, appointments);

  const selectedAssessment = activeAssessmentId
    ? (assessmentsState.find((a) => a.id === activeAssessmentId) ?? null)
    : null;

  const upcomingAppointments = appointments
    .filter((a) => isFuture(new Date(a.appointment_date)) && a.status !== "ANULAT")
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 3);
  const pastAppointments = appointments
    .filter((a) => isPast(new Date(a.appointment_date)))
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
    .slice(0, 4);
  const nextAppointment = upcomingAppointments[0] ?? null;
  const lastCompletedAppointment = [...appointments]
    .filter((a) => a.status === "FINALIZAT")
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0] ?? null;
  const latestInvoice = [...payments]
    .sort((a, b) => new Date(b.issued_at ?? 0).getTime() - new Date(a.issued_at ?? 0).getTime())[0] ?? null;
  const serviceType = isServiceType(client.service_type) ? client.service_type : "UNDECIDED";
  const riskLevel = client.risk_level;
  const riskLabel = riskLevel && isRiskLevel(riskLevel) ? RISK_LEVEL_LABELS[riskLevel] : null;
  const riskVariant =
    riskLevel && isRiskLevel(riskLevel) ? RISK_LEVEL_BADGE_VARIANTS[riskLevel] : null;
  const completedArtifacts: string[] = [
    anamnesisFormState?.form_type,
    clinicalInterviewFormState?.form_type,
    riskAssessmentFormState?.form_type,
    dbtCommitmentFormState?.form_type,
    dbtProgressFormState?.form_type,
    cbtProgressFormState?.form_type,
    counselingPlanFormState?.form_type,
    recommendationsFormState?.form_type,
    counselingProgressFormState?.form_type,
    cbtFormulationState ? "CBT_CASE_FORMULATION" : null,
    safetyPlanState ? "SAFETY_PLAN" : null,
  ].flatMap((value) => (value ? [value] : []));
  const nextSessionChecklist = [
    !client.gdpr_consent_signed ? "Consimțământ GDPR lipsă" : null,
    !lifecycle.isOnboardingComplete ? "Onboarding incomplet" : null,
    !client.contract_url && !client.terms_consent_signed_at ? "Contract / termeni lipsă" : null,
    serviceType === "DBT" && !nextAppointment?.hasDiaryCardThisWeek ? "Jurnal DBT lipsă pentru săptămâna curentă" : null,
    (serviceType === "DBT" || serviceType === "CLINICAL_PSYCHOLOGY") && !client.risk_level
      ? "Evaluare de risc necompletată"
      : null,
    lastCompletedAppointment && !(lastCompletedAppointment.notes?.length)
      ? "Ultima ședință finalizată nu are notă"
      : null,
    lastCompletedAppointment && !(lastCompletedAppointment.invoices?.length)
      ? "Ultima ședință finalizată nu are factură"
      : null,
  ].filter((item): item is string => Boolean(item));

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
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl font-bold"
              onClick={() => setIsEditOverlayOpen(true)}
            >
              <Pencil className="h-4 w-4" />
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
        clientId={client.id}
        serviceType={client.service_type ?? null}
        serviceTrackStatus={client.service_track_status ?? null}
        lifecycleStatus={lifecycle.status}
        gdprSigned={client.gdpr_consent_signed}
        onboardingComplete={lifecycle.isOnboardingComplete}
        hasAppointments={lifecycle.hasCompletedSession || lifecycle.hasUpcomingSession}
        riskLevel={client.risk_level ?? null}
      />

      {!anonymized && (
        <DocumentRequirementsCard
          client={client}
          docs={clientDocsState}
          assessments={assessmentsState}
          completedArtifacts={completedArtifacts}
        />
      )}

      {!anonymized && (
        <ClinicalContextCard client={client} />
      )}

      {!anonymized && (
        <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 lg:max-w-md">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Pregătire Sesiune
                </p>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  Ce urmează pentru acest client
                </h3>
              </div>

              {nextAppointment ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info" className="normal-case tracking-normal">
                      Următoarea ședință
                    </Badge>
                    {riskLabel && riskVariant ? (
                      <Badge
                        variant={riskVariant}
                        className="normal-case tracking-normal"
                      >
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        {riskLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {format(new Date(nextAppointment.appointment_date), "EEEE, d MMM yyyy · HH:mm", { locale: ro })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextAppointment.duration_minutes} minute
                    {nextAppointment.meet_link ? " · online" : nextAppointment.location_tag ? ` · ${nextAppointment.location_tag}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-xl">
                      <Link href={`/dashboard/appointments/${nextAppointment.id}`}>
                        Deschide programarea
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href={`/dashboard/appointments/${nextAppointment.id}/edit`}>
                        Editează
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Nicio ședință programată"
                  description="Clientul nu are încă o programare viitoare. Poți crea rapid una nouă din această zonă."
                  icon={Calendar}
                  action={{ label: "Adaugă programare", href: `/dashboard/appointments/new?clientId=${client.id}` }}
                />
              )}
            </div>

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Ultima Ședință
                </p>
                {lastCompletedAppointment ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      {format(new Date(lastCompletedAppointment.appointment_date), "d MMM yyyy · HH:mm", { locale: ro })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={lastCompletedAppointment.notes?.length ? "success" : "warning"}
                        className="normal-case tracking-normal"
                      >
                        {lastCompletedAppointment.notes?.length ? "Notă existentă" : "Notă lipsă"}
                      </Badge>
                      <Badge
                        variant={lastCompletedAppointment.invoices?.length ? "info" : "outline"}
                        className="normal-case tracking-normal"
                      >
                        {lastCompletedAppointment.invoices?.length ? "Factură emisă" : "Fără factură"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href={`/dashboard/notes/${lastCompletedAppointment.id}`}>
                          {lastCompletedAppointment.notes?.length ? "Vezi nota" : "Adaugă notă"}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link
                          href={
                            lastCompletedAppointment.invoices?.length
                              ? `/dashboard/appointments/${lastCompletedAppointment.id}`
                              : `/dashboard/invoices/new?appointmentId=${lastCompletedAppointment.id}`
                          }
                        >
                          {lastCompletedAppointment.invoices?.length ? "Vezi programarea" : "Emite factură"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nu există încă o ședință finalizată pentru acest client.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Checklist Următoare Ședință
                </p>
                {nextSessionChecklist.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {nextSessionChecklist.slice(0, 5).map((item) => (
                      <li key={item} className="flex gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Fișa pare pregătită pentru următoarea sesiune.</span>
                  </div>
                )}
                {latestInvoice ? (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Ultima Factură
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          latestInvoice.status === "PLĂTITĂ"
                            ? "success"
                            : latestInvoice.status === "RESTANTĂ"
                              ? "destructive"
                              : "secondary"
                        }
                        className="normal-case tracking-normal"
                      >
                        {latestInvoice.smartbill_series}/{latestInvoice.smartbill_number} · {latestInvoice.status}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

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

      <section className="rounded-[2rem] border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr] xl:items-center">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Workspace client
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Navigare clinică și administrativă dintr-un singur loc
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Taburile clientului folosesc acum aceeași logică vizuală ca dashboard-ul principal și schimbă contextul fără să rupă ritmul de lucru.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ClientWorkspaceStat
              label="View activ"
              value={WORKSPACE_VIEWS.find((view) => view.id === activeView)?.label ?? "Sumar"}
              hint={isTabPending ? "Se pregătește următoarea secțiune" : "Secțiunea curentă a fișei clientului"}
              tone={isTabPending ? "warning" : "default"}
            />
            <ClientWorkspaceStat
              label="Tranziție"
              value={isTabPending ? "În curs" : "Stabilă"}
              hint={isTabPending ? "Păstrăm contextul vizibil până se schimbă pagina" : "Schimbarea de view este pregătită pentru navigare fluidă"}
              tone={isTabPending ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="mt-4 inline-flex rounded-[1.25rem] border border-border/60 bg-muted/40 p-1">
          <div className="flex flex-wrap gap-1">
          {WORKSPACE_VIEWS.map((view) => {
            const active = activeView === view.id;

            return (
              <Link
                key={view.id}
                href={buildClientUrl({ view: view.id })}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  handleWorkspaceNavigation(view.id);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-bold transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  isTabPending && active && "animate-pulse-subtle",
                )}
                aria-current={active ? "page" : undefined}
              >
                {view.label}
              </Link>
            );
          })}
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all duration-300",
              isTabPending ? "w-2/3 animate-pulse-subtle" : "w-1/3",
              activeView === "clinic" && !isTabPending && "ml-[33%]",
              activeView === "appointments" && !isTabPending && "ml-[66%] w-1/3",
              activeView === "lifecycle" && !isTabPending && "ml-[100%] w-0",
            )}
          />
        </div>
      </section>

      <div
        className={cn(
          "transition-[opacity,transform,filter] duration-300 ease-out",
          isTabPending && "pointer-events-none opacity-70 blur-[0.5px]",
        )}
      >
      {activeView === "overview" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <WidgetCard
              icon={Mail}
              title="Contact & Profil"
              value={anonymized ? "REDACTED" : (client.email ?? "—")}
              link={buildClientUrl({ view: "overview", section: "contact" })}
              onClick={(event) => {
                event.preventDefault();
                openSection("contact");
              }}
              badge={client.gdpr_consent_signed ? "GDPR OK" : "GDPR LIPSĂ"}
              badgeVariant={client.gdpr_consent_signed ? "success" : "warning"}
            />
            <WidgetCard
              icon={Wallet}
              title="Financiar"
              value={`${aiClientContext.totalAmount} RON`}
              link={buildClientUrl({ view: "overview", section: "finance" })}
              onClick={(event) => {
                event.preventDefault();
                openSection("finance");
              }}
              subtitle={`${aiClientContext.totalSessions} ședințe totale`}
            />
            <WidgetCard
              icon={FileText}
              title="Dosar Medical"
              value={`${clientDocsState.length + medicationCountState} Fișiere`}
              link={buildClientUrl({ view: "overview", section: "medical" })}
              onClick={(event) => {
                event.preventDefault();
                openSection("medical");
              }}
              subtitle={`${medicationCountState} medicamente active`}
            />
            <WidgetCard
              icon={ShieldOff}
              title="Monitorizare Risc"
              value={crisisNotesCountState > 0 ? `${crisisNotesCountState} Note active` : "Fără incidente"}
              link={buildClientUrl({ view: "overview", section: "crisis" })}
              onClick={(event) => {
                event.preventDefault();
                openSection("crisis");
              }}
              badge={crisisNotesCountState > 0 ? "URGENT" : "STABIL"}
              badgeVariant={crisisNotesCountState > 0 ? "destructive" : "outline"}
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
              {isClinicDataLoading && !hasLoadedClinicData ? (
                <Skeleton className="h-[18rem] rounded-[2rem]" />
              ) : (
                <ClientEvolutionChart assessments={assessmentsState} />
              )}
            </div>
            <div className="lg:col-span-1">
              {isClinicDataLoading && !hasLoadedClinicData ? (
                <Skeleton className="h-[18rem] rounded-[2rem]" />
              ) : (
                <ClientDriveDocuments clientId={id} documents={clientDocsState.slice(0, 5)} />
              )}
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

              {isClinicDataLoading && !hasLoadedClinicData ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-40 rounded-[1.75rem]" />
                  <Skeleton className="h-40 rounded-[1.75rem]" />
                  <Skeleton className="h-40 rounded-[1.75rem]" />
                </div>
              ) : assessmentsState.length === 0 ? (
                <EmptyState
                  title="Nu există evaluări încă"
                  description="După primele teste administrate, aici vor apărea scorurile și interpretările relevante."
                  icon={Brain}
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assessmentsState.map((acc) => (
                    <AssessmentCard
                      key={acc.id}
                      acc={acc}
                      href={buildClientUrl({ view: "clinic", assessment: acc.id })}
                      isActive={activeAssessmentId === acc.id}
                      onClick={(event) => {
                        event.preventDefault();
                        openAssessment(acc.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {!anonymized && isClinicDataLoading && !hasLoadedClinicData ? (
            <div className="grid gap-6">
              <Skeleton className="h-56 rounded-[1.75rem]" />
              <Skeleton className="h-56 rounded-[1.75rem]" />
            </div>
          ) : null}

          {!anonymized && client.service_type === "CBT" && hasLoadedClinicData ? (
            <>
              <HomeworkCard clientId={client.id} items={homeworkItemsState} />
              <CbtCaseFormulationCard clientId={client.id} formulation={cbtFormulationState} />
              <CbtProgressCard clientId={client.id} form={cbtProgressFormState} />
            </>
          ) : null}

          {!anonymized && client.service_type === "DBT" && hasLoadedClinicData ? (
            <>
              <SafetyPlanCard clientId={client.id} plan={safetyPlanState} />
              <DbtDiaryCardsPanel clientId={client.id} cards={dbtDiaryCardsState} />
              <RiskAssessmentCard clientId={client.id} form={riskAssessmentFormState} currentRiskLevel={client.risk_level as import("@/lib/clients/service-track").RiskLevel | null} />
              <DbtCommitmentCard clientId={client.id} form={dbtCommitmentFormState} />
              <DbtProgressCard clientId={client.id} form={dbtProgressFormState} />
            </>
          ) : null}

          {!anonymized && client.service_type === "CLINICAL_PSYCHOLOGY" && hasLoadedClinicData ? (
            <>
              <SafetyPlanCard clientId={client.id} plan={safetyPlanState} />
              <AnamnesisCard clientId={client.id} form={anamnesisFormState} />
              <ClinicalInterviewCard clientId={client.id} form={clinicalInterviewFormState} />
              <RiskAssessmentCard clientId={client.id} form={riskAssessmentFormState} currentRiskLevel={client.risk_level as import("@/lib/clients/service-track").RiskLevel | null} />
            </>
          ) : null}

          {!anonymized && client.service_type === "COUNSELING" && hasLoadedClinicData ? (
            <>
              <CounselingPlanCard clientId={client.id} form={counselingPlanFormState} />
              <RecommendationsCard clientId={client.id} form={recommendationsFormState} />
              <CounselingProgressCard clientId={client.id} form={counselingProgressFormState} />
            </>
          ) : null}
        </>
      ) : null}

      {activeView === "lifecycle" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Istoric lifecycle"
            description="Ultimele schimbări de status pentru această fișă, utile pentru context administrativ și continuitate."
            icon={Clock}
          >
            <div className="p-6">
              {isLifecycleDataLoading && !hasLoadedLifecycleData ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-[1.5rem]" />
                  <Skeleton className="h-20 rounded-[1.5rem]" />
                  <Skeleton className="h-20 rounded-[1.5rem]" />
                </div>
              ) : lifecycleHistoryState.length > 0 ? (
                <div className="space-y-3">
                  {lifecycleHistoryState.map((entry) => (
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

          <SectionCard
            title="Istoric acces"
            description="Ultimele accesări și exporturi sensibile legate de această fișă."
            icon={ShieldAlert}
          >
            <div className="p-6">
              {isLifecycleDataLoading && !hasLoadedLifecycleData ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-[1.5rem]" />
                  <Skeleton className="h-24 rounded-[1.5rem]" />
                  <Skeleton className="h-24 rounded-[1.5rem]" />
                </div>
              ) : accessHistoryState.length > 0 ? (
                <div className="space-y-3">
                  {accessHistoryState.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {entry.category}
                          </Badge>
                          <Badge
                            variant={
                              entry.severity === "CRITICAL"
                                ? "destructive"
                                : entry.severity === "WARNING"
                                  ? "warning"
                                  : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {entry.severity}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(new Date(entry.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-xs text-foreground">{entry.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Actor: {entry.actor_role ?? "—"} · Status: {entry.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Niciun eveniment de acces încă"
                  description="Vizualizările, download-urile și alte acțiuni sensibile vor apărea aici."
                  icon={ShieldAlert}
                />
              )}
            </div>
          </SectionCard>
        </div>
      ) : null}
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <PersonalInfoOverlay
        isOpen={activeSection === "contact"}
        onClose={closeSectionOverlay}
        client={client}
        anonymized={anonymized}
      />
      <FinancialDetailOverlay
        isOpen={activeSection === "finance"}
        onClose={closeSectionOverlay}
        payments={payments}
        clientName={client.full_name ?? "Client"}
      />
      <MedicalDetailOverlay
        isOpen={activeSection === "medical"}
        onClose={closeSectionOverlay}
        documents={clientDocsState}
        medications={clientMedsState}
        isLoading={isClinicDataLoading && !hasLoadedClinicData}
        clientName={client.full_name ?? "Client"}
      />
      <CrisisNotesDetailOverlay
        isOpen={activeSection === "crisis"}
        onClose={closeSectionOverlay}
        notes={crisisNotesState}
        isLoading={isClinicDataLoading && !hasLoadedClinicData}
        clientName={client.full_name ?? "Client"}
      />
      {selectedAssessment && (
        <AssessmentDetailOverlay
          assessment={selectedAssessment}
          clientName={client.full_name ?? "Client"}
          isMinor={isMinor}
          sendReportToParent={client.send_report_to_parent ?? false}
          onClose={closeAssessmentOverlay}
        />
      )}

      {/* ── Contract Generator ─────────────────────────────────────────── */}
      <ContractGeneratorModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        client={client}
      />
      <ClientEditOverlay
        isOpen={isEditOverlayOpen}
        onClose={() => setIsEditOverlayOpen(false)}
        client={client}
      />
    </div>
  );
}

function ClientWorkspaceStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4 shadow-sm",
        tone === "default" && "border-border/60 bg-card/90",
        tone === "success" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20",
        tone === "warning" && "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20",
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
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
  onClick,
}: WidgetCardProps) {
  return (
    <ActionCard
      href={link}
      icon={Icon}
      title={title}
      value={value}
      subtitle={subtitle}
      onClick={onClick}
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
  href,
  isActive,
  onClick,
}: {
  acc: ClientAssessment;
  href: string;
  isActive: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const scoringTestType =
    typeof acc.scoring_data.test_type === "string"
      ? acc.scoring_data.test_type
      : "Rezultat Test";

  return (
    <ActionCard
      href={href}
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
      onClick={onClick}
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
