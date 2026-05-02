import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import type {
  HomeworkItem,
  CbtCaseFormulation,
  DbtDiaryCard,
  SafetyPlan,
} from "@/components/clients/types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ClientStatusHistoryRow =
  Database["public"]["Tables"]["client_status_history"]["Row"];
export type ClientWithLifecycleRow = ClientRow & {
  appointments?: Pick<AppointmentRow, "appointment_date" | "status">[] | null;
};

export async function listClients(): Promise<ClientWithLifecycleRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, appointments(appointment_date, status)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ClientWithLifecycleRow[];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function isLifecycleSchemaMissing(message: string) {
  return message.includes("client_status_history");
}

export async function getClientStatusHistory(
  clientId: string,
): Promise<ClientStatusHistoryRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_status_history")
    .select("*")
    .eq("client_id", clientId)
    .order("changed_at", { ascending: false })
    .limit(8);

  if (error) {
    if (isLifecycleSchemaMissing(error.message)) return [];
    throw new Error(error.message);
  }

  return data ?? [];
}

function isP2TableMissing(message: string) {
  return (
    message.includes("homework_items") ||
    message.includes("cbt_case_formulations") ||
    message.includes("dbt_diary_cards") ||
    message.includes("safety_plans")
  );
}

export async function getHomeworkItems(clientId: string): Promise<HomeworkItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_items")
    .select("id, client_id, description, due_date, completed_at, therapist_notes, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isP2TableMissing(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as HomeworkItem[];
}

export async function getCbtCaseFormulation(clientId: string): Promise<CbtCaseFormulation | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cbt_case_formulations")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) {
    if (isP2TableMissing(error.message)) return null;
    throw new Error(error.message);
  }
  return data as CbtCaseFormulation | null;
}

export async function getDbtDiaryCards(clientId: string): Promise<DbtDiaryCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dbt_diary_cards")
    .select("*")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false })
    .limit(12);
  if (error) {
    if (isP2TableMissing(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as DbtDiaryCard[];
}

export async function getSafetyPlan(clientId: string): Promise<SafetyPlan | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("safety_plans")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) {
    if (isP2TableMissing(error.message)) return null;
    throw new Error(error.message);
  }
  return data as SafetyPlan | null;
}
