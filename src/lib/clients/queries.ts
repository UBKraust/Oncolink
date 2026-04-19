import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockClients } from "@/lib/mock/clients";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export async function listClients(): Promise<ClientRow[]> {
  if (!isSupabaseConfigured()) return mockClients as unknown as ClientRow[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  if (!isSupabaseConfigured()) {
    return (mockClients.find((c) => c.id === id) as unknown as ClientRow) ?? null;
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
