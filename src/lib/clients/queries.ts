import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/lib/appointments/helpers";

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
