import {
  addDays,
  differenceInDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

import { isServiceType, SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/clients/service-track";
import { deriveLocation, type AppointmentStatus, type LocationKind } from "@/lib/appointments/helpers";
import { initialsFromName } from "@/lib/clients/validation";
import { isPaidInvoiceStatus, normalizeInvoiceStatus } from "@/lib/invoices/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type InvoiceWithAppointmentClient = {
  id: string;
  smartbill_series: string | null;
  smartbill_number: string | null;
  amount: number | null;
  issued_at: string;
  status: string;
  appointments:
    | { clients: { full_name: string | null } | { full_name: string | null }[] | null }
    | { clients: { full_name: string | null } | { full_name: string | null }[] | null }[]
    | null;
};

type AppointmentWithClient = {
  id: string;
  client_id: string;
  appointment_date: string;
  duration_minutes: number | null;
  status: string | null;
  is_external_duty: boolean | null;
  location_tag: string | null;
  meet_link: string | null;
  notes?: { id: string }[] | { id: string } | null;
  invoices?: { id: string }[] | { id: string } | null;
  clients:
    | {
        full_name: string | null;
        service_type?: string | null;
        risk_level?: string | null;
        contract_url?: string | null;
        terms_consent_signed_at?: string | null;
      }
    | {
        full_name: string | null;
        service_type?: string | null;
        risk_level?: string | null;
        contract_url?: string | null;
        terms_consent_signed_at?: string | null;
      }[]
    | null;
};

type DashboardClientRow = {
  id: string;
  full_name: string | null;
  gdpr_consent_signed: boolean | null;
  onboarding_completed_at: string | null;
  needs_legal_review: boolean | null;
  is_minor: boolean | null;
  contract_url: string | null;
  terms_consent_signed_at: string | null;
  service_type: string | null;
  service_track_status: string | null;
  lifecycle_status: string | null;
  location: string | null;
  billing_type: string | null;
  company_name: string | null;
  risk_level: string | null;
  send_report_to_parent: boolean | null;
  research_consent: boolean | null;
};

type DashboardDocumentRow = {
  id: string;
  client_id: string | null;
  document_type: string;
  file_name: string;
  uploaded_at: string | null;
};

type DashboardGeneratedContractRow = {
  id: string;
  client_id: string;
};

type DashboardAssessmentRow = {
  id: string;
  client_id: string | null;
  assessment_type: string | null;
  scoring_data: Record<string, unknown> | null;
  content_summary: string | null;
  sent_to_parent_at: string | null;
  created_at: string | null;
  clients?: { full_name: string | null } | { full_name: string | null }[] | null;
};

type DashboardStructuredAssessmentRow = {
  id: string;
  client_id: string | null;
  created_at: string | null;
  calculated_score: Record<string, unknown> | null;
  test?: { name: string | null } | { name: string | null }[] | null;
};

type DashboardHomeworkRow = {
  id: string;
  client_id: string;
  description: string;
  due_date: string | null;
  completed_at: string | null;
};

type DashboardDiaryCardRow = {
  id: string;
  client_id: string;
  week_start: string;
};

type DashboardSafetyPlanRow = {
  id: string;
  client_id: string;
};

type DashboardCompletedAppointmentRow = {
  id: string;
  client_id: string;
  appointment_date: string;
};

export interface DashboardStats {
  totalRevenue: number;
  expensesMonth: number;
  netProfitMonth: number;
  appointmentsToday: number;
  totalHours: number;
  pendingMinorReviews: number;
  privatePatients: number;
  clinicPatients: number;
  minorPatients: number;
  adultPatients: number;
  b2bPatients: number;
  vaultAlertsCount: number;
  vaultTotalDocs: number;
}

export type DashboardAlert = {
  id: string;
  type: "LEGAL" | "CLINICAL" | "DOCUMENT" | "FINANCIAL" | "SYSTEM";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
};

export type DashboardTask = {
  id: string;
  clientId?: string;
  clientName?: string;
  type: "CONTRACT" | "ONBOARDING" | "GDPR" | "MINOR_LEGAL" | "CAS" | "REPORT";
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  priority: "low" | "medium" | "high";
};

export type DashboardServiceTrackStat = {
  serviceType: ServiceType;
  label: string;
  activeClients: number;
  nextActionCount: number;
  nextActionLabel: string;
  secondaryLabel?: string;
  href: string;
};

export type DashboardAssessmentTask = {
  id: string;
  clientId?: string;
  clientName?: string;
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  priority: "low" | "medium" | "high";
};

export type DashboardResearchReadiness = {
  serviceTypesConfigured: number;
  totalClients: number;
  assessmentsCount: number;
  clientsWithScores: number;
  researchConsents: number;
  hasData: boolean;
};

export type TodayFinanceNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  tone: "default" | "warning" | "danger";
};

export type TodayFinanceSnapshot = {
  outstandingCount: number;
  outstandingTotal: number;
  invoicesToIssueCount: number;
  invoicesToFollowUpCount: number;
  notifications: TodayFinanceNotification[];
};

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalRevenue: 0,
  expensesMonth: 0,
  netProfitMonth: 0,
  appointmentsToday: 0,
  totalHours: 0,
  pendingMinorReviews: 0,
  privatePatients: 0,
  clinicPatients: 0,
  minorPatients: 0,
  adultPatients: 0,
  b2bPatients: 0,
  vaultAlertsCount: 0,
  vaultTotalDocs: 0,
};

const SERVICE_TRACK_ORDER: ServiceType[] = [
  "CLINICAL_PSYCHOLOGY",
  "CBT",
  "DBT",
  "COUNSELING",
  "UNDECIDED",
];

const CLOSED_LIFECYCLE_STATUSES = new Set(["INCHEIAT", "NECONVERSIE", "ANONIMIZAT"]);

function emptyResearchReadiness(): DashboardResearchReadiness {
  return {
    serviceTypesConfigured: 0,
    totalClients: 0,
    assessmentsCount: 0,
    clientsWithScores: 0,
    researchConsents: 0,
    hasData: false,
  };
}

function emptyTodayFinanceSnapshot(): TodayFinanceSnapshot {
  return {
    outstandingCount: 0,
    outstandingTotal: 0,
    invoicesToIssueCount: 0,
    invoicesToFollowUpCount: 0,
    notifications: [],
  };
}

function uniqueClientName(name: string | null | undefined) {
  return name?.trim() || "Client";
}

function normalizeServiceType(value: string | null | undefined): ServiceType {
  return isServiceType(value) && value !== "MIXED" ? value : "UNDECIDED";
}

function getAssessmentClientName(
  relation: DashboardAssessmentRow["clients"],
  fallback = "Client",
) {
  const clientRelation = Array.isArray(relation) ? relation[0] : relation;
  return uniqueClientName(clientRelation?.full_name ?? fallback);
}

function getTestName(
  relation: DashboardStructuredAssessmentRow["test"],
  fallback = "Evaluare",
) {
  const testRelation = Array.isArray(relation) ? relation[0] : relation;
  return testRelation?.name?.trim() || fallback;
}

async function getDashboardCollections() {
  if (!isSupabaseConfigured()) {
    return {
      clients: [] as DashboardClientRow[],
      documents: [] as DashboardDocumentRow[],
      generatedContracts: [] as DashboardGeneratedContractRow[],
      assessments: [] as DashboardAssessmentRow[],
      structuredAssessments: [] as DashboardStructuredAssessmentRow[],
      homeworkItems: [] as DashboardHomeworkRow[],
      diaryCards: [] as DashboardDiaryCardRow[],
      safetyPlans: [] as DashboardSafetyPlanRow[],
      completedAppointments: [] as DashboardCompletedAppointmentRow[],
      unpaidInvoices: [] as Awaited<ReturnType<typeof getUnpaidInvoices>>,
      vaultAlertsCount: 0,
    };
  }

  const supabase = await createSupabaseServerClient();

  const [
    clientsRes,
    documentsRes,
    contractsRes,
    assessmentsRes,
    structuredAssessmentsRes,
    homeworkItemsRes,
    diaryCardsRes,
    safetyPlansRes,
    completedAppointmentsRes,
    unpaidInvoices,
    vaultAlertsRes,
  ] =
    await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, full_name, gdpr_consent_signed, onboarding_completed_at, needs_legal_review, is_minor, contract_url, terms_consent_signed_at, service_type, service_track_status, lifecycle_status, location, billing_type, company_name, risk_level, send_report_to_parent, research_consent",
        )
        .then((r) => (r.error ? { data: [] as DashboardClientRow[] } : r)),
      supabase
        .from("patient_documents")
        .select("id, client_id, document_type, file_name, uploaded_at")
        .then((r) => (r.error ? { data: [] as DashboardDocumentRow[] } : r)),
      supabase
        .from("generated_contracts")
        .select("id, client_id")
        .then((r) => (r.error ? { data: [] as DashboardGeneratedContractRow[] } : r)),
      supabase
        .from("assessments")
        .select("id, client_id, assessment_type, scoring_data, content_summary, sent_to_parent_at, created_at, clients(full_name)")
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r) => (r.error ? { data: [] as DashboardAssessmentRow[] } : r)),
      supabase
        .from("client_assessments")
        .select("id, client_id, created_at, calculated_score, test:psychological_tests(name)")
        .order("created_at", { ascending: false })
        .limit(40)
        .then((r) => (r.error ? { data: [] as DashboardStructuredAssessmentRow[] } : r)),
      supabase
        .from("homework_items")
        .select("id, client_id, description, due_date, completed_at")
        .order("created_at", { ascending: false })
        .limit(40)
        .then((r) => (r.error ? { data: [] as DashboardHomeworkRow[] } : r)),
      supabase
        .from("dbt_diary_cards")
        .select("id, client_id, week_start")
        .order("week_start", { ascending: false })
        .limit(40)
        .then((r) => (r.error ? { data: [] as DashboardDiaryCardRow[] } : r)),
      supabase
        .from("safety_plans")
        .select("id, client_id")
        .then((r) => (r.error ? { data: [] as DashboardSafetyPlanRow[] } : r)),
      supabase
        .from("appointments")
        .select("id, client_id, appointment_date")
        .eq("status", "FINALIZAT")
        .order("appointment_date", { ascending: false })
        .limit(200)
        .then((r) => (r.error ? { data: [] as DashboardCompletedAppointmentRow[] } : r)),
      getUnpaidInvoices(),
      supabase
        .from("therapist_documents")
        .select("*", { count: "exact", head: true })
        .not("expiry_date", "is", null)
        .lte("expiry_date", endOfDay(addDays(new Date(), 30)).toISOString())
        .then((r) => (r.error ? { count: 0 } : r)),
    ]);

  return {
    clients: (clientsRes.data ?? []) as DashboardClientRow[],
    documents: (documentsRes.data ?? []) as DashboardDocumentRow[],
    generatedContracts: (contractsRes.data ?? []) as DashboardGeneratedContractRow[],
    assessments: (assessmentsRes.data ?? []) as DashboardAssessmentRow[],
    structuredAssessments: (structuredAssessmentsRes.data ?? []) as DashboardStructuredAssessmentRow[],
    homeworkItems: (homeworkItemsRes.data ?? []) as DashboardHomeworkRow[],
    diaryCards: (diaryCardsRes.data ?? []) as DashboardDiaryCardRow[],
    safetyPlans: (safetyPlansRes.data ?? []) as DashboardSafetyPlanRow[],
    completedAppointments: (completedAppointmentsRes.data ?? []) as DashboardCompletedAppointmentRow[],
    unpaidInvoices,
    vaultAlertsCount: vaultAlertsRes.count ?? 0,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return EMPTY_DASHBOARD_STATS;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const now = new Date();
    const startMonth = startOfMonth(now).toISOString();
    const endMonth = endOfMonth(now).toISOString();
    const startToday = startOfDay(now).toISOString();
    const endToday = endOfDay(now).toISOString();

    const [invoicesRes, expensesRes, todayCountRes, monthlyAppsRes, minorRes, clientsRes, vaultTotalRes, vaultAlertsRes] =
      await Promise.all([
        supabase
          .from("invoices")
          .select("amount")
          .gte("issued_at", startMonth)
          .lte("issued_at", endMonth),
        supabase
          .from("cabinet_expenses")
          .select("amount")
          .gte("expense_date", startMonth)
          .lte("expense_date", endMonth),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_date", startToday)
          .lte("appointment_date", endToday),
        supabase
          .from("appointments")
          .select("duration_minutes")
          .gte("appointment_date", startMonth)
          .lte("appointment_date", endMonth)
          .eq("status", "FINALIZAT"),
        supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("is_minor", true)
          .eq("needs_legal_review", true),
        supabase
          .from("clients")
          .select("is_minor, billing_type, company_name, location"),
        supabase
          .from("therapist_documents")
          .select("*", { count: "exact", head: true })
          .then((r) => (r.error ? { count: 0 } : r)),
        supabase
          .from("therapist_documents")
          .select("*", { count: "exact", head: true })
          .not("expiry_date", "is", null)
          .lte("expiry_date", endOfDay(addDays(now, 30)).toISOString())
          .then((r) => (r.error ? { count: 0 } : r)),
      ]);

    const totalRevenue = (invoicesRes.data ?? []).reduce(
      (sum, invoice) => sum + Number(invoice.amount ?? 0),
      0,
    );
    const expensesMonth = (expensesRes.data ?? []).reduce(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0,
    );
    const totalMinutes = (monthlyAppsRes.data ?? []).reduce(
      (sum, appointment) => sum + (appointment.duration_minutes || 50),
      0,
    );

    const clients = clientsRes.data ?? [];
    const minorPatients = clients.filter((client) => client.is_minor).length;
    const adultPatients = clients.length - minorPatients;
    const b2bPatients = clients.filter(
      (client) => client.billing_type === "B2B_COMPANY" || client.company_name,
    ).length;
    const privatePatients = clients.filter(
      (client) => client.location === "CABINET_PARTICULAR",
    ).length;
    const clinicPatients = clients.filter(
      (client) => client.location === "CLINICA",
    ).length;

    return {
      totalRevenue,
      expensesMonth,
      netProfitMonth: totalRevenue - expensesMonth,
      appointmentsToday: todayCountRes.count || 0,
      totalHours: Math.round(totalMinutes / 60),
      pendingMinorReviews: minorRes.count || 0,
      privatePatients,
      clinicPatients,
      minorPatients,
      adultPatients,
      b2bPatients,
      vaultAlertsCount: vaultAlertsRes.count || 0,
      vaultTotalDocs: vaultTotalRes.count || 0,
    };
  } catch {
    return EMPTY_DASHBOARD_STATS;
  }
}

export async function getUnpaidInvoices() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("invoices")
      .select("*, appointments(clients(full_name))")
      .order("issued_at", { ascending: false })
      .limit(20);

    const now = new Date();

    return (
      (data as InvoiceWithAppointmentClient[] | null)
        ?.filter((invoice) => {
          const normalizedStatus = normalizeInvoiceStatus(invoice.status);
          return normalizedStatus !== "ANULATĂ" && !isPaidInvoiceStatus(normalizedStatus);
        })
        .slice(0, 5)
        .map((invoice) => {
          const appointmentRelation = Array.isArray(invoice.appointments)
            ? invoice.appointments[0]
            : invoice.appointments;
          const clientRelation = Array.isArray(appointmentRelation?.clients)
            ? appointmentRelation.clients[0]
            : appointmentRelation?.clients;

          return {
            id: invoice.id,
            clientName: uniqueClientName(clientRelation?.full_name ?? "Client necunoscut"),
            series: invoice.smartbill_series || "FĂRĂ",
            number: invoice.smartbill_number || "0000",
            amount: Number(invoice.amount ?? 0),
            issuedAt: new Date(invoice.issued_at),
            daysOverdue: differenceInDays(now, new Date(invoice.issued_at)),
            status: invoice.status,
          };
        }) || []
    );
  } catch {
    return [];
  }
}

export async function getAppointmentsToday() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const now = new Date();
    const weekStartDate = startOfDay(
      subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1),
    );
    const { data } = await supabase
      .from("appointments")
      .select(
        "id, client_id, appointment_date, duration_minutes, status, is_external_duty, location_tag, meet_link, notes(id), invoices(id), clients(full_name, service_type, risk_level, contract_url, terms_consent_signed_at)",
      )
      .gte("appointment_date", startOfDay(now).toISOString())
      .lte("appointment_date", endOfDay(now).toISOString())
      .order("appointment_date", { ascending: true });

    const appointments = (data as AppointmentWithClient[] | null) ?? [];
    const dbtClientIds = appointments
      .map((appointment) => {
        const clientRelation = Array.isArray(appointment.clients)
          ? appointment.clients[0]
          : appointment.clients;
        return clientRelation?.service_type === "DBT" ? appointment.client_id : null;
      })
      .filter((id): id is string => Boolean(id));

    const diaryCardsRes = dbtClientIds.length
      ? await supabase
          .from("dbt_diary_cards")
          .select("client_id, week_start")
          .in("client_id", dbtClientIds)
          .gte("week_start", weekStartDate.toISOString().slice(0, 10))
          .then((r) =>
            r.error
              ? { data: [] as Array<{ client_id: string; week_start: string }> }
              : r,
          )
      : { data: [] as Array<{ client_id: string; week_start: string }> };

    const diaryClientIds = new Set(
      (diaryCardsRes.data ?? []).map((card) => card.client_id),
    );

    return (
      appointments.map((appointment) => {
        const clientRelation = Array.isArray(appointment.clients)
          ? appointment.clients[0]
          : appointment.clients;
        const clientName = uniqueClientName(clientRelation?.full_name);
        const notesRelation = Array.isArray(appointment.notes)
          ? appointment.notes[0]
          : appointment.notes;
        const invoiceRelation = Array.isArray(appointment.invoices)
          ? appointment.invoices[0]
          : appointment.invoices;
        const serviceType = clientRelation?.service_type ?? null;

        return {
          id: appointment.id,
          clientId: appointment.client_id,
          clientName,
          clientInitials: initialsFromName(clientName),
          startsAt: new Date(appointment.appointment_date),
          durationMinutes: appointment.duration_minutes || 50,
          status: (appointment.status || "PROGRAMAT") as AppointmentStatus,
          location: deriveLocation({
            meet_link: appointment.meet_link,
            is_external_duty: appointment.is_external_duty || false,
            location_tag: appointment.location_tag,
          }) as LocationKind,
          isExternalDuty: appointment.is_external_duty || false,
          meetLink: appointment.meet_link || undefined,
          serviceType,
          riskLevel: clientRelation?.risk_level ?? null,
          hasContract: Boolean(
            clientRelation?.contract_url || clientRelation?.terms_consent_signed_at,
          ),
          hasSessionNote: Boolean(notesRelation?.id),
          hasInvoice: Boolean(invoiceRelation?.id),
          hasDiaryCardThisWeek:
            serviceType === "DBT"
              ? diaryClientIds.has(appointment.client_id)
              : undefined,
        };
      })
    );
  } catch {
    return [];
  }
}

export async function getUpcomingAppointments() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const tomorrow = addDays(new Date(), 1);
    const { data } = await supabase
      .from("appointments")
      .select("*, clients(full_name)")
      .gte("appointment_date", startOfDay(tomorrow).toISOString())
      .order("appointment_date", { ascending: true })
      .limit(10);

    return (
      (data as AppointmentWithClient[] | null)?.map((appointment) => {
        const clientRelation = Array.isArray(appointment.clients)
          ? appointment.clients[0]
          : appointment.clients;
        const clientName = uniqueClientName(clientRelation?.full_name);

        return {
          id: appointment.id,
          clientName,
          clientInitials: initialsFromName(clientName),
          startsAt: new Date(appointment.appointment_date),
          durationMinutes: appointment.duration_minutes || 50,
          status: (appointment.status || "PROGRAMAT") as AppointmentStatus,
          location: deriveLocation({
            meet_link: appointment.meet_link,
            is_external_duty: appointment.is_external_duty || false,
            location_tag: appointment.location_tag,
          }) as LocationKind,
          isExternalDuty: appointment.is_external_duty || false,
          meetLink: appointment.meet_link || undefined,
        };
      }) || []
    );
  } catch {
    return [];
  }
}

export async function getDashboardClinicalAlerts(limit = 5): Promise<DashboardAlert[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const {
      clients,
      assessments,
      unpaidInvoices,
      vaultAlertsCount,
      homeworkItems,
      diaryCards,
      safetyPlans,
    } = await getDashboardCollections();
    const alerts: DashboardAlert[] = [];
    const currentWeekStart = startOfDay(subDays(new Date(), new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))
      .toISOString()
      .slice(0, 10);

    const pendingMinorReviews = clients.filter(
      (client) => client.is_minor && client.needs_legal_review,
    ).length;
    if (pendingMinorReviews > 0) {
      alerts.push({
        id: "minor-legal-review",
        type: "LEGAL",
        severity: "critical",
        title: "Validare juridică pentru minori",
        description: `${pendingMinorReviews} dosare de minori necesită verificare juridică înainte de continuarea fluxului.`,
        href: "/dashboard/clients?filter=review",
        ctaLabel: "Vezi dosare",
      });
    }

    const gdprMissing = clients.filter(
      (client) => !client.gdpr_consent_signed && client.lifecycle_status !== "ANONIMIZAT",
    ).length;
    if (gdprMissing > 0) {
      alerts.push({
        id: "gdpr-missing",
        type: "LEGAL",
        severity: gdprMissing >= 3 ? "critical" : "warning",
        title: "Consimțământ GDPR lipsă",
        description: `${gdprMissing} fișe active au nevoie de confirmarea consimțământului GDPR.`,
        href: "/dashboard/clients?filter=gdpr-missing",
        ctaLabel: "Vezi cohorta",
      });
    }

    const onboardingIncomplete = clients.filter(
      (client) => !client.onboarding_completed_at && client.lifecycle_status !== "ANONIMIZAT",
    ).length;
    if (onboardingIncomplete > 0) {
      alerts.push({
        id: "onboarding-incomplete",
        type: "DOCUMENT",
        severity: "warning",
        title: "Onboarding incomplet",
        description: `${onboardingIncomplete} clienți au rămas blocați înainte de finalizarea onboardingului.`,
        href: "/dashboard/clients?filter=onboarding",
        ctaLabel: "Continuă fluxul",
      });
    }

    const missingServiceType = clients.filter(
      (client) => normalizeServiceType(client.service_type) === "UNDECIDED",
    ).length;
    if (missingServiceType > 0) {
      alerts.push({
        id: "service-type-missing",
        type: "CLINICAL",
        severity: "info",
        title: "Service track neconfigurat",
        description: `${missingServiceType} fișe nu au încă tipul principal de serviciu setat.`,
        href: "/dashboard/clients?service=UNDECIDED",
        ctaLabel: "Vezi fișe",
      });
    }

    const dbtHighRiskWithoutPlan = clients.filter((client) => {
      if (normalizeServiceType(client.service_type) !== "DBT") return false;
      if (!["HIGH", "CRISIS"].includes(client.risk_level ?? "")) return false;
      return !safetyPlans.some((plan) => plan.client_id === client.id);
    }).length;
    if (dbtHighRiskWithoutPlan > 0) {
      alerts.push({
        id: "dbt-risk-without-safety-plan",
        type: "CLINICAL",
        severity: "critical",
        title: "Cazuri DBT fără plan de siguranță",
        description: `${dbtHighRiskWithoutPlan} clienți DBT cu risc ridicat nu au încă plan de siguranță salvat.`,
        href: "/dashboard/clients?service=DBT&filter=high-risk",
        ctaLabel: "Verifică DBT",
      });
    }

    const dbtDiaryMissing = clients.filter((client) => {
      if (normalizeServiceType(client.service_type) !== "DBT") return false;
      if (CLOSED_LIFECYCLE_STATUSES.has(client.lifecycle_status ?? "")) return false;
      return !diaryCards.some(
        (card) =>
          card.client_id === client.id &&
          card.week_start >= currentWeekStart,
      );
    }).length;
    if (dbtDiaryMissing > 0) {
      alerts.push({
        id: "dbt-diary-missing",
        type: "CLINICAL",
        severity: "warning",
        title: "Diary card DBT lipsă săptămâna aceasta",
        description: `${dbtDiaryMissing} clienți DBT activi nu au încă diary card în săptămâna curentă.`,
        href: "/dashboard/clients?service=DBT",
        ctaLabel: "Vezi cazuri DBT",
      });
    }

    const overdueHomework = homeworkItems.filter((item) => {
      if (item.completed_at) return false;
      if (!item.due_date) return false;
      return new Date(item.due_date) < startOfDay(new Date());
    }).length;
    if (overdueHomework > 0) {
      alerts.push({
        id: "cbt-homework-overdue",
        type: "CLINICAL",
        severity: "info",
        title: "Teme CBT restante",
        description: `${overdueHomework} teme pentru acasă au depășit termenul și merită follow-up.`,
        href: "/dashboard/clients?service=CBT",
        ctaLabel: "Vezi teme",
      });
    }

    const pendingReports = assessments.filter(
      (assessment) =>
        assessment.assessment_type === "RAPORT_LUNAR" &&
        !assessment.sent_to_parent_at,
    );
    if (pendingReports.length > 0) {
      const firstPendingReport = pendingReports.find((assessment) => assessment.client_id);
      alerts.push({
        id: "report-pending",
        type: "DOCUMENT",
        severity: "warning",
        title: "Rapoarte către aparținători în așteptare",
        description: `${pendingReports.length} rapoarte lunare nu au fost marcate ca trimise.`,
        href:
          firstPendingReport?.client_id && firstPendingReport.id
            ? `/dashboard/clients/${firstPendingReport.client_id}?view=clinic&assessment=${firstPendingReport.id}`
            : "/dashboard/assessments",
        ctaLabel: firstPendingReport ? "Deschide un raport" : "Vezi evaluări",
      });
    }

    const overdueInvoices = unpaidInvoices.filter((invoice) => invoice.daysOverdue >= 21).length;
    if (overdueInvoices > 0) {
      alerts.push({
        id: "overdue-invoices",
        type: "FINANCIAL",
        severity: overdueInvoices >= 3 ? "warning" : "info",
        title: "Facturi restante vechi",
        description: `${overdueInvoices} facturi sunt neachitate de peste 21 de zile.`,
        href: "/dashboard/invoices",
        ctaLabel: "Vezi facturi",
      });
    }

    if (vaultAlertsCount > 0) {
      alerts.push({
        id: "vault-alerts",
        type: "SYSTEM",
        severity: "info",
        title: "Documente profesionale care expiră",
        description: `${vaultAlertsCount} documente din seiful cabinetului expiră în următoarele 30 de zile.`,
        href: "/dashboard/vault",
        ctaLabel: "Deschide seiful",
      });
    }

    return alerts
      .sort((a, b) => {
        const severityScore = { critical: 0, warning: 1, info: 2 };
        return severityScore[a.severity] - severityScore[b.severity];
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getDashboardDocumentTasks(limit = 5): Promise<DashboardTask[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { clients, generatedContracts, assessments } = await getDashboardCollections();
    const tasks: DashboardTask[] = [];
    const generatedContractClientIds = new Set(generatedContracts.map((contract) => contract.client_id));
    const recentAssessmentsByClient = new Set(
      assessments
        .filter((assessment) => assessment.client_id)
        .map((assessment) => assessment.client_id as string),
    );

    for (const client of clients) {
      const clientName = uniqueClientName(client.full_name);
      const isArchived = client.lifecycle_status === "ANONIMIZAT";
      if (isArchived) continue;

      if (!client.gdpr_consent_signed) {
        tasks.push({
          id: `${client.id}-gdpr`,
          clientId: client.id,
          clientName,
          type: "GDPR",
          title: `${clientName} — GDPR lipsă`,
          description: "Confirmă consimțământul înainte de continuarea fluxului clinic.",
          href: `/dashboard/clients/${client.id}/edit`,
          ctaLabel: "Vezi fișă",
          priority: "high",
        });
      }

      if (!client.onboarding_completed_at) {
        tasks.push({
          id: `${client.id}-onboarding`,
          clientId: client.id,
          clientName,
          type: "ONBOARDING",
          title: `${clientName} — onboarding incomplet`,
          description: client.is_minor
            ? "Fluxul minorului trebuie finalizat împreună cu reprezentantul legal."
            : "Trimite sau reia formularul de onboarding pentru a completa dosarul.",
          href: `/dashboard/clients/${client.id}/onboarding`,
          ctaLabel: "Trimite link",
          priority: "high",
        });
      }

      const hasContract = Boolean(client.contract_url || client.terms_consent_signed_at || generatedContractClientIds.has(client.id));
      if (!hasContract) {
        tasks.push({
          id: `${client.id}-contract`,
          clientId: client.id,
          clientName,
          type: "CONTRACT",
          title: `${clientName} — contract lipsă`,
          description: "Generează documentul contractual minim pentru dosarul activ.",
          href: `/dashboard/clients/${client.id}`,
          ctaLabel: "Generează",
          priority: "medium",
        });
      }

      if (client.is_minor && client.needs_legal_review) {
        tasks.push({
          id: `${client.id}-minor-legal`,
          clientId: client.id,
          clientName,
          type: "MINOR_LEGAL",
          title: `${clientName} — revizuire legală minor`,
          description: "Verifică acordurile parentale și documentele de reprezentare legală.",
          href: `/dashboard/clients/${client.id}`,
          ctaLabel: "Verifică",
          priority: "high",
        });
      }

      if (client.send_report_to_parent && recentAssessmentsByClient.has(client.id)) {
        const latestPendingReport = assessments.find(
          (assessment) =>
            assessment.client_id === client.id &&
            assessment.assessment_type === "RAPORT_LUNAR" &&
            !assessment.sent_to_parent_at,
        );
        if (latestPendingReport) {
          tasks.push({
            id: `${client.id}-report-parent`,
            clientId: client.id,
            clientName,
            type: "REPORT",
          title: `${clientName} — raport nesendat către părinte`,
          description: "Marchează trimiterea raportului sau revizuiește dacă mai este necesar.",
          href: `/dashboard/clients/${client.id}?view=clinic&assessment=${latestPendingReport.id}`,
          ctaLabel: "Vezi raport",
          priority: "medium",
        });
      }
      }
    }

    const priorityScore = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => priorityScore[a.priority] - priorityScore[b.priority]).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getDashboardServiceTrackStats(): Promise<DashboardServiceTrackStat[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const {
      clients,
      homeworkItems,
      diaryCards,
      safetyPlans,
      assessments,
      completedAppointments,
    } = await getDashboardCollections();
    const trackMap = new Map<ServiceType, DashboardServiceTrackStat>();
    const currentWeekStart = startOfDay(subDays(new Date(), new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))
      .toISOString()
      .slice(0, 10);

    for (const serviceType of SERVICE_TRACK_ORDER) {
      trackMap.set(serviceType, {
        serviceType,
        label: SERVICE_TYPE_LABELS[serviceType],
        activeClients: 0,
        nextActionCount: 0,
        nextActionLabel: serviceType === "DBT" ? "cazuri sensibile" : "acțiuni următoare",
        secondaryLabel: undefined,
        href:
          serviceType === "UNDECIDED"
            ? "/dashboard/clients?service=UNDECIDED"
            : `/dashboard/clients?service=${serviceType}`,
      });
    }

    for (const client of clients) {
      if (CLOSED_LIFECYCLE_STATUSES.has(client.lifecycle_status ?? "")) continue;

      const serviceType = normalizeServiceType(client.service_type);
      const track = trackMap.get(serviceType);
      if (!track) continue;

      track.activeClients += 1;

      const needsNextAction =
        !client.gdpr_consent_signed ||
        !client.onboarding_completed_at ||
        (serviceType === "DBT" && (client.risk_level === "HIGH" || client.risk_level === "CRISIS")) ||
        !client.service_track_status;

      if (needsNextAction) {
        track.nextActionCount += 1;
      }
    }

    const clinicalTrack = trackMap.get("CLINICAL_PSYCHOLOGY");
    if (clinicalTrack) {
      const pendingReports = assessments.filter(
        (assessment) =>
          assessment.assessment_type === "RAPORT_LUNAR" &&
          !assessment.sent_to_parent_at,
      ).length;
      clinicalTrack.secondaryLabel =
        pendingReports > 0 ? `${pendingReports} rapoarte în lucru` : "fără blocaje majore";
    }

    const cbtTrack = trackMap.get("CBT");
    if (cbtTrack) {
      const overdueHomework = homeworkItems.filter((item) => {
        if (item.completed_at || !item.due_date) return false;
        const client = clients.find((entry) => entry.id === item.client_id);
        return normalizeServiceType(client?.service_type) === "CBT" && new Date(item.due_date) < startOfDay(new Date());
      }).length;
      const reevaluationsDue = clients.filter((client) => {
        if (normalizeServiceType(client.service_type) !== "CBT") return false;
        const sessionsCount = completedAppointments.filter((appointment) => appointment.client_id === client.id).length;
        return sessionsCount >= 4;
      }).length;
      cbtTrack.nextActionCount = Math.max(cbtTrack.nextActionCount, overdueHomework);
      cbtTrack.secondaryLabel =
        overdueHomework > 0
          ? `${overdueHomework} teme restante`
          : reevaluationsDue > 0
            ? `${reevaluationsDue} reevaluări de pregătit`
            : "ritm stabil";
      cbtTrack.nextActionLabel = overdueHomework > 0 ? "teme active" : "următorul pas";
    }

    const dbtTrack = trackMap.get("DBT");
    if (dbtTrack) {
      const highRisk = clients.filter(
        (client) =>
          normalizeServiceType(client.service_type) === "DBT" &&
          ["HIGH", "CRISIS"].includes(client.risk_level ?? ""),
      ).length;
      const diaryMissing = clients.filter((client) => {
        if (normalizeServiceType(client.service_type) !== "DBT") return false;
        if (CLOSED_LIFECYCLE_STATUSES.has(client.lifecycle_status ?? "")) return false;
        return !diaryCards.some(
          (card) =>
            card.client_id === client.id &&
            card.week_start >= currentWeekStart,
        );
      }).length;
      const safetyPlanMissing = clients.filter((client) => {
        if (normalizeServiceType(client.service_type) !== "DBT") return false;
        return ["HIGH", "CRISIS"].includes(client.risk_level ?? "") &&
          !safetyPlans.some((plan) => plan.client_id === client.id);
      }).length;
      dbtTrack.nextActionCount = Math.max(dbtTrack.nextActionCount, highRisk, diaryMissing, safetyPlanMissing);
      dbtTrack.secondaryLabel =
        highRisk > 0
          ? `${highRisk} risc ridicat`
          : diaryMissing > 0
            ? `${diaryMissing} diary lipsă`
            : "monitorizare stabilă";
    }

    const counselingTrack = trackMap.get("COUNSELING");
    if (counselingTrack) {
      const reevaluationCandidates = clients.filter((client) => {
        if (normalizeServiceType(client.service_type) !== "COUNSELING") return false;
        const sessionsCount = completedAppointments.filter((appointment) => appointment.client_id === client.id).length;
        return sessionsCount >= 3;
      }).length;
      counselingTrack.secondaryLabel =
        reevaluationCandidates > 0
          ? `${reevaluationCandidates} reevaluări necesare`
          : "urmărire ușoară";
    }

    const undecidedTrack = trackMap.get("UNDECIDED");
    if (undecidedTrack) {
      undecidedTrack.secondaryLabel =
        undecidedTrack.activeClients > 0
          ? "clasificare necesară"
          : "toate cazurile sunt clasificate";
    }

    const stats = SERVICE_TRACK_ORDER.map((serviceType) => trackMap.get(serviceType) as DashboardServiceTrackStat);
    const hasConfiguredTrack = stats.some(
      (track) => track.serviceType !== "UNDECIDED" && track.activeClients > 0,
    );

    return hasConfiguredTrack ? stats : [];
  } catch {
    return [];
  }
}

export async function getDashboardAssessmentTasks(limit = 5): Promise<DashboardAssessmentTask[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const {
      clients,
      assessments,
      structuredAssessments,
      diaryCards,
      completedAppointments,
    } = await getDashboardCollections();
    const tasks: DashboardAssessmentTask[] = [];
    const thirtyDaysAgo = subDays(new Date(), 30);
    const clientsWithAssessments = new Set(
      assessments
        .filter((assessment) => assessment.client_id)
        .map((assessment) => assessment.client_id as string),
    );
    const clientsWithStructuredAssessments = new Set(
      structuredAssessments
        .filter((assessment) => assessment.client_id)
        .map((assessment) => assessment.client_id as string),
    );
    const currentWeekStart = startOfDay(subDays(new Date(), new Date().getDay() === 0 ? 6 : new Date().getDay() - 1))
      .toISOString()
      .slice(0, 10);

    for (const assessment of assessments) {
      const clientName = getAssessmentClientName(assessment.clients);
      const createdAt = assessment.created_at ? new Date(assessment.created_at) : null;

      if (assessment.assessment_type === "RAPORT_LUNAR" && !assessment.sent_to_parent_at) {
        tasks.push({
          id: `${assessment.id}-report`,
          clientId: assessment.client_id ?? undefined,
          clientName,
          title: `${clientName} — raport lunar în așteptare`,
          description: "Raportul există, dar nu este încă marcat ca trimis.",
          href: assessment.client_id
            ? `/dashboard/clients/${assessment.client_id}?view=clinic&assessment=${assessment.id}`
            : "/dashboard/assessments",
          ctaLabel: assessment.client_id ? "Deschide raportul" : "Vezi evaluări",
          priority: "high",
        });
      }

      if (
        createdAt &&
        createdAt >= thirtyDaysAgo &&
        (!assessment.content_summary || !assessment.content_summary.trim())
      ) {
        tasks.push({
          id: `${assessment.id}-summary`,
          clientId: assessment.client_id ?? undefined,
          clientName,
          title: `${clientName} — evaluare fără summary`,
          description: "Adaugă un rezumat clinic scurt pentru continuitatea dosarului.",
          href: assessment.client_id
            ? `/dashboard/clients/${assessment.client_id}?view=clinic&assessment=${assessment.id}`
            : "/dashboard/assessments",
          ctaLabel: assessment.client_id ? "Completează din fișă" : "Completează",
          priority: "medium",
        });
      }
    }

    for (const assessment of structuredAssessments) {
      if (!assessment.client_id) continue;
      const client = clients.find((entry) => entry.id === assessment.client_id);
      const clientName = uniqueClientName(client?.full_name);
      const score = assessment.calculated_score;

      if (!score || Object.keys(score).length === 0) {
        tasks.push({
          id: `${assessment.id}-structured-score`,
          clientId: assessment.client_id,
          clientName,
          title: `${clientName} — evaluare fără scor calculat`,
          description: `${getTestName(assessment.test)} a fost salvată, dar nu are încă rezultat calculat util în dashboard.`,
          href: `/dashboard/clients/${assessment.client_id}?view=clinic`,
          ctaLabel: "Vezi fișa",
          priority: "medium",
        });
      }
    }

    for (const client of clients) {
      if (normalizeServiceType(client.service_type) !== "DBT") continue;
      if (CLOSED_LIFECYCLE_STATUSES.has(client.lifecycle_status ?? "")) continue;
      const hasDiaryThisWeek = diaryCards.some(
        (card) =>
          card.client_id === client.id &&
          card.week_start >= currentWeekStart,
      );
      if (!hasDiaryThisWeek) {
        tasks.push({
          id: `${client.id}-dbt-diary`,
          clientId: client.id,
          clientName: uniqueClientName(client.full_name),
          title: `${uniqueClientName(client.full_name)} — diary card lipsă`,
          description: "Săptămâna curentă nu are încă diary card înregistrat pentru cazul DBT.",
          href: `/dashboard/clients/${client.id}?view=clinic`,
          ctaLabel: "Deschide fișa",
          priority: "high",
        });
      }
    }

    for (const client of clients) {
      if (CLOSED_LIFECYCLE_STATUSES.has(client.lifecycle_status ?? "")) continue;
      if (!client.onboarding_completed_at) continue;

      if (!clientsWithAssessments.has(client.id) && !clientsWithStructuredAssessments.has(client.id)) {
        tasks.push({
          id: `${client.id}-initial-assessment`,
          clientId: client.id,
          clientName: uniqueClientName(client.full_name),
          title: `${uniqueClientName(client.full_name)} — fără evaluare inițială`,
          description: "Adaugă prima evaluare pentru a ancora traseul clinic și raportarea ulterioară.",
          href: `/dashboard/assessments/new?clientId=${client.id}`,
          ctaLabel: "Evaluare nouă",
          priority: "medium",
        });
      }

      const serviceType = normalizeServiceType(client.service_type);
      if (serviceType === "CBT" || serviceType === "CLINICAL_PSYCHOLOGY") {
        const sessionsCount = completedAppointments.filter((appointment) => appointment.client_id === client.id).length;
        if (sessionsCount >= 4) {
          tasks.push({
            id: `${client.id}-t1-due`,
            clientId: client.id,
            clientName: uniqueClientName(client.full_name),
            title: `${uniqueClientName(client.full_name)} — reevaluare utilă după ${sessionsCount} ședințe`,
            description: "Cazul a depășit pragul minim pentru o nouă evaluare de progres.",
            href: `/dashboard/assessments/new?clientId=${client.id}`,
            ctaLabel: "Evaluează",
            priority: "medium",
          });
        }
      }
    }

    const priorityScore = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => priorityScore[a.priority] - priorityScore[b.priority]).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getDashboardResearchReadiness(): Promise<DashboardResearchReadiness> {
  if (!isSupabaseConfigured()) {
    return emptyResearchReadiness();
  }

  try {
    const { clients, assessments } = await getDashboardCollections();
    const serviceTypesConfigured = clients.filter(
      (client) => normalizeServiceType(client.service_type) !== "UNDECIDED",
    ).length;
    const clientsWithScores = assessments.filter((assessment) => {
      const scoring = assessment.scoring_data;
      return Boolean(scoring && Object.keys(scoring).length > 0);
    }).length;
    const researchConsents = clients.filter((client) => client.research_consent).length;

    return {
      serviceTypesConfigured,
      totalClients: clients.length,
      assessmentsCount: assessments.length,
      clientsWithScores,
      researchConsents,
      hasData:
        serviceTypesConfigured > 0 ||
        assessments.length > 0 ||
        clientsWithScores > 0 ||
        researchConsents > 0,
    };
  } catch {
    return emptyResearchReadiness();
  }
}

export async function getTodayFinanceSnapshot(): Promise<TodayFinanceSnapshot> {
  if (!isSupabaseConfigured()) {
    return emptyTodayFinanceSnapshot();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7).toISOString();
    const startToday = startOfDay(now).toISOString();
    const endToday = endOfDay(now).toISOString();

    const [unpaidInvoices, completedTodayRes, recentIssuedRes] = await Promise.all([
      getUnpaidInvoices(),
      supabase
        .from("appointments")
        .select("id, appointment_date, clients(full_name), invoices(id)")
        .eq("status", "FINALIZAT")
        .gte("appointment_date", startToday)
        .lte("appointment_date", endToday)
        .then((r) =>
          r.error
            ? {
                data: [] as Array<{
                  id: string;
                  appointment_date: string;
                  clients: { full_name: string | null } | { full_name: string | null }[] | null;
                  invoices: { id: string } | { id: string }[] | null;
                }>,
              }
            : r,
        ),
      supabase
        .from("invoices")
        .select("id, issued_at, status, client_name, amount")
        .gte("issued_at", sevenDaysAgo)
        .order("issued_at", { ascending: false })
        .limit(20)
        .then((r) =>
          r.error
            ? {
                data: [] as Array<{
                  id: string;
                  issued_at: string;
                  status: string;
                  client_name: string | null;
                  amount: number | null;
                }>,
              }
            : r,
        ),
    ]);

    const outstandingCount = unpaidInvoices.length;
    const outstandingTotal = unpaidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount ?? 0),
      0,
    );

    const invoicesToIssueRows =
      completedTodayRes.data?.filter((appointment) => {
        const relation = Array.isArray(appointment.invoices)
          ? appointment.invoices[0]
          : appointment.invoices;
        return !relation?.id;
      }) ?? [];

    const invoicesToFollowUpRows =
      recentIssuedRes.data?.filter((invoice) => {
        const normalizedStatus = normalizeInvoiceStatus(invoice.status);
        return normalizedStatus === "EMISĂ" || normalizedStatus === "RESTANTĂ";
      }) ?? [];

    const notifications: TodayFinanceNotification[] = [];

    if (outstandingCount > 0) {
      notifications.push({
        id: "outstanding",
        title: `${outstandingCount} plăți restante`,
        description: `${outstandingTotal.toFixed(2)} RON încă de recuperat din facturile emise.`,
        href: "/dashboard/invoices?status=RESTANTĂ",
        ctaLabel: "Vezi restante",
        tone: outstandingCount >= 3 ? "danger" : "warning",
      });
    }

    if (invoicesToIssueRows.length > 0) {
      notifications.push({
        id: "to-issue",
        title: `${invoicesToIssueRows.length} facturi de emis`,
        description: "Ședințe finalizate astăzi fără factură asociată.",
        href: "/dashboard/invoices/new",
        ctaLabel: "Emite acum",
        tone: "warning",
      });
    }

    if (invoicesToFollowUpRows.length > 0) {
      notifications.push({
        id: "to-follow-up",
        title: `${invoicesToFollowUpRows.length} facturi de urmărit`,
        description: "Fallback sigur: facturi emise recent care încă nu apar ca plătite.",
        href: "/dashboard/invoices?status=EMISĂ",
        ctaLabel: "Verifică",
        tone: "default",
      });
    }

    return {
      outstandingCount,
      outstandingTotal,
      invoicesToIssueCount: invoicesToIssueRows.length,
      invoicesToFollowUpCount: invoicesToFollowUpRows.length,
      notifications,
    };
  } catch {
    return emptyTodayFinanceSnapshot();
  }
}
