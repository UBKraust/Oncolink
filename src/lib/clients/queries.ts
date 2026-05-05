import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import type {
  HomeworkItem,
  CbtCaseFormulation,
  DbtDiaryCard,
  SafetyPlan,
  ClientAccessHistoryItem,
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

export async function getClientAccessHistory(
  clientId: string,
): Promise<ClientAccessHistoryItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("audit_logs")
    .select("id, action, category, severity, status, actor_role, metadata, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    if (String(error.message).includes("audit_logs")) return [];
    throw new Error(error.message);
  }

  return (data ?? []) as ClientAccessHistoryItem[];
}

export interface ClientDeletionImpact {
  canDelete: boolean;
  appointmentCount: number;
  finalizedAppointmentCount: number;
  invoiceCount: number;
  generatedContractCount: number;
  blockers: string[];
}

export async function getClientDeletionImpact(
  clientId: string,
): Promise<ClientDeletionImpact> {
  if (!isSupabaseConfigured()) {
    return {
      canDelete: false,
      appointmentCount: 0,
      finalizedAppointmentCount: 0,
      invoiceCount: 0,
      generatedContractCount: 0,
      blockers: ["Supabase nu este configurat."],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: appointments, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("client_id", clientId);

  if (appointmentError) throw new Error(appointmentError.message);

  const appointmentIds = (appointments ?? []).map((appointment) => appointment.id);
  const finalizedAppointmentCount = (appointments ?? []).filter(
    (appointment) => appointment.status === "FINALIZAT",
  ).length;

  let invoiceCount = 0;
  if (appointmentIds.length > 0) {
    const { count, error } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("appointment_id", appointmentIds);
    if (error) throw new Error(error.message);
    invoiceCount = count ?? 0;
  }

  const { count: generatedContractCount, error: contractError } = await supabase
    .from("generated_contracts")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (contractError) throw new Error(contractError.message);

  const blockers: string[] = [];
  if (finalizedAppointmentCount > 0) {
    blockers.push("Clientul are ședințe finalizate și trebuie păstrat pentru continuitate clinică.");
  }
  if (invoiceCount > 0) {
    blockers.push("Clientul are facturi asociate și nu poate fi șters din motive contabile.");
  }
  if ((generatedContractCount ?? 0) > 0) {
    blockers.push("Clientul are contracte generate oficial și nu poate fi șters definitiv.");
  }

  return {
    canDelete: blockers.length === 0,
    appointmentCount: appointments?.length ?? 0,
    finalizedAppointmentCount,
    invoiceCount,
    generatedContractCount: generatedContractCount ?? 0,
    blockers,
  };
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
