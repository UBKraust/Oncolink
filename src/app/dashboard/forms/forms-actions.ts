"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import { isRiskLevel, type RiskLevel } from "@/lib/clients/service-track";

export type ClinicalFormType =
  | "ANAMNESIS"
  | "CLINICAL_INTERVIEW"
  | "RISK_ASSESSMENT"
  | "DBT_COMMITMENT"
  | "DBT_PROGRESS"
  | "COUNSELING_PLAN"
  | "RECOMMENDATIONS"
  | "CBT_PROGRESS"
  | "COUNSELING_PROGRESS";

export type ReportType = "ADULT" | "MINOR" | "B2B_WELLBEING";
export type FormStatus = "DRAFT" | "COMPLETE";
export type ReportStatus = "DRAFT" | "FINAL";

export interface ClinicalFormRow {
  id: string;
  client_id: string;
  therapist_id: string;
  form_type: ClinicalFormType;
  title: string | null;
  content: unknown;
  status: FormStatus;
  created_at: string;
  updated_at: string;
}

export interface TherapyReportRow {
  id: string;
  client_id: string;
  therapist_id: string;
  report_type: ReportType;
  report_number: string | null;
  title: string | null;
  content: unknown;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export type ClinicalFormsReadiness = {
  state: "safe" | "partial" | "blocked";
  formsAvailable: boolean;
  reportsAvailable: boolean;
  message: string | null;
};

function isP3TableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    (error.message?.includes("does not exist") ?? false)
  );
}

function extractRiskLevel(content: unknown): RiskLevel | null | undefined {
  if (!content || typeof content !== "object" || Array.isArray(content)) return undefined;
  const riskLevel = (content as Record<string, unknown>).risk_level;
  if (typeof riskLevel !== "string") return undefined;
  return isRiskLevel(riskLevel) ? riskLevel : null;
}

function extractClientSyncPayload(
  formType: ClinicalFormType,
  content: unknown,
): Record<string, unknown> {
  if (!content || typeof content !== "object" || Array.isArray(content)) return {};

  const values = content as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if (formType === "RISK_ASSESSMENT") {
    const riskLevel = extractRiskLevel(content);
    if (riskLevel !== undefined) {
      payload.risk_level = riskLevel;
    }
  }

  if (formType === "ANAMNESIS") {
    const chiefComplaint = values.chief_complaint;
    if (typeof chiefComplaint === "string" && chiefComplaint.trim()) {
      payload.main_complaint = chiefComplaint.trim();
    }
  }

  if (formType === "DBT_COMMITMENT") {
    const therapyGoals = values.therapy_goals;
    if (
      Array.isArray(therapyGoals) &&
      therapyGoals.every((goal) => typeof goal === "string")
    ) {
      payload.treatment_goals = therapyGoals
        .map((goal) => goal.trim())
        .filter(Boolean);
    }
  }

  return payload;
}

function revalidateClinicalPaths(clientId: string, reportId?: string) {
  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/clients/${clientId}`);
  if (reportId) {
    revalidatePath(`/dashboard/forms/report/${reportId}`);
  }
}

export async function getClinicalFormsReadiness(): Promise<ClinicalFormsReadiness> {
  const supabase = await createClient();
  const [formsProbe, reportsProbe] = await Promise.all([
    supabase.from("clinical_forms").select("id", { count: "exact", head: true }).limit(1),
    supabase.from("therapy_reports").select("id", { count: "exact", head: true }).limit(1),
  ]);

  const formsMissing = isP3TableMissing(formsProbe.error);
  const reportsMissing = isP3TableMissing(reportsProbe.error);

  if (formsMissing && reportsMissing) {
    return {
      state: "blocked",
      formsAvailable: false,
      reportsAvailable: false,
      message: "Migrările P3 pentru fișe clinice și rapoarte nu sunt disponibile încă în baza curentă.",
    };
  }

  if (formsMissing || reportsMissing) {
    return {
      state: "partial",
      formsAvailable: !formsMissing,
      reportsAvailable: !reportsMissing,
      message: "Doar o parte din infrastructura P3 este disponibilă. Unele liste sau acțiuni clinice pot lipsi temporar.",
    };
  }

  const firstError = formsProbe.error ?? reportsProbe.error;
  if (firstError) {
    return {
      state: "blocked",
      formsAvailable: false,
      reportsAvailable: false,
      message: firstError.message,
    };
  }

  return {
    state: "safe",
    formsAvailable: true,
    reportsAvailable: true,
    message: null,
  };
}

// ─── Clinical Forms ───────────────────────────────────────────────────────────

export async function listClinicalForms(filters?: {
  clientId?: string;
  formType?: ClinicalFormType;
  status?: FormStatus;
}): Promise<ClinicalFormRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clinical_forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.formType) query = query.eq("form_type", filters.formType);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (isP3TableMissing(error)) return [];
  if (error) throw error;
  return (data ?? []) as ClinicalFormRow[];
}

export async function getClinicalForm(id: string): Promise<ClinicalFormRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_forms")
    .select("*")
    .eq("id", id)
    .single();
  if (isP3TableMissing(error)) return null;
  if (error) return null;
  return data as ClinicalFormRow;
}

export async function getLatestClinicalForm(
  clientId: string,
  formType: ClinicalFormType,
): Promise<ClinicalFormRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_forms")
    .select("*")
    .eq("client_id", clientId)
    .eq("form_type", formType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (isP3TableMissing(error)) return null;
  if (error) return null;
  return data as ClinicalFormRow | null;
}

export async function upsertClinicalForm(data: {
  id?: string;
  clientId: string;
  formType: ClinicalFormType;
  title?: string;
  content: unknown;
  status?: FormStatus;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const clientSyncPayload = extractClientSyncPayload(data.formType, data.content);

  const payload = {
    client_id: data.clientId,
    therapist_id: user.id,
    form_type: data.formType,
    title: data.title ?? null,
    content: data.content,
    status: data.status ?? "DRAFT",
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await supabase
      .from("clinical_forms")
      .update(payload)
      .eq("id", data.id)
      .eq("therapist_id", user.id);
    if (error) return { error: error.message };
    if (Object.keys(clientSyncPayload).length > 0) {
      const { error: clientError } = await supabase
        .from("clients")
        .update(clientSyncPayload)
        .eq("id", data.clientId)
        .eq("therapist_id", user.id);
      if (clientError) {
        return { error: "Fișa a fost salvată, dar datele nu s-au sincronizat complet în dosarul clientului." };
      }
    }
    revalidateClinicalPaths(data.clientId);
    return { id: data.id };
  }

  const { data: inserted, error } = await supabase
    .from("clinical_forms")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (Object.keys(clientSyncPayload).length > 0) {
    const { error: clientError } = await supabase
      .from("clients")
      .update(clientSyncPayload)
      .eq("id", data.clientId)
      .eq("therapist_id", user.id);
    if (clientError) {
      return { error: "Fișa a fost salvată, dar datele nu s-au sincronizat complet în dosarul clientului." };
    }
  }
  revalidateClinicalPaths(data.clientId);
  return { id: inserted.id };
}

export async function deleteClinicalForm(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("clinical_forms")
    .select("client_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("clinical_forms").delete().eq("id", id);
  if (error) return { error: error.message };
  if (existing?.client_id) {
    revalidateClinicalPaths(existing.client_id);
  }
  return {};
}

// ─── Therapy Reports ──────────────────────────────────────────────────────────

export async function listTherapyReports(filters?: {
  clientId?: string;
  reportType?: ReportType;
  status?: ReportStatus;
}): Promise<TherapyReportRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("therapy_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.reportType) query = query.eq("report_type", filters.reportType);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (isP3TableMissing(error)) return [];
  if (error) throw error;
  return (data ?? []) as TherapyReportRow[];
}

export async function getTherapyReport(id: string): Promise<TherapyReportRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("therapy_reports")
    .select("*")
    .eq("id", id)
    .single();
  if (isP3TableMissing(error)) return null;
  if (error) return null;
  return data as TherapyReportRow;
}

export async function upsertTherapyReport(data: {
  id?: string;
  clientId: string;
  reportType?: ReportType;
  reportNumber?: string;
  title?: string;
  content: unknown;
  status?: ReportStatus;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const payload = {
    client_id: data.clientId,
    therapist_id: user.id,
    report_type: data.reportType ?? "ADULT",
    report_number: data.reportNumber ?? null,
    title: data.title ?? null,
    content: data.content,
    status: data.status ?? "DRAFT",
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await supabase
      .from("therapy_reports")
      .update(payload)
      .eq("id", data.id)
      .eq("therapist_id", user.id);
    if (error) return { error: error.message };
    revalidateClinicalPaths(data.clientId, data.id);
    return { id: data.id };
  }

  const { data: inserted, error } = await supabase
    .from("therapy_reports")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidateClinicalPaths(data.clientId, inserted.id);
  return { id: inserted.id };
}

export async function finalizeTherapyReport(
  id: string,
  reportNumber: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("therapy_reports")
    .update({ status: "FINAL", report_number: reportNumber, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("therapist_id", user.id);
  if (error) return { error: error.message };
  const { data: report } = await supabase
    .from("therapy_reports")
    .select("client_id")
    .eq("id", id)
    .maybeSingle();
  if (report?.client_id) {
    revalidateClinicalPaths(report.client_id, id);
  }

  void logAuditEvent({
    action: 'REPORT_FINALIZED',
    category: 'REPORT',
    entityType: 'report',
    entityId: id,
    clientId: report?.client_id ?? undefined,
    severity: 'WARNING',
    metadata: { report_number: reportNumber },
  })

  return {};
}
