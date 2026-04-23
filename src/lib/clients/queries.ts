import type { Database } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export async function listClients(): Promise<ClientRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
