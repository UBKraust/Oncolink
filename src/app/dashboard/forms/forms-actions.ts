"use server";

import { createClient } from "@/lib/supabase/server";

export type ClinicalFormType =
  | "ANAMNESIS"
  | "CLINICAL_INTERVIEW"
  | "RISK_ASSESSMENT"
  | "DBT_COMMITMENT"
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

function isP3TableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    (error.message?.includes("does not exist") ?? false)
  );
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
    return { id: data.id };
  }

  const { data: inserted, error } = await supabase
    .from("clinical_forms")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: inserted.id };
}

export async function deleteClinicalForm(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("clinical_forms").delete().eq("id", id);
  if (error) return { error: error.message };
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
    return { id: data.id };
  }

  const { data: inserted, error } = await supabase
    .from("therapy_reports")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { error: error.message };
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
  return {};
}
