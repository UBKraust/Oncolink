"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CrisisNote {
  id: string;
  client_id: string;
  note: string;
  encrypted_content: string | null;
  contact_method: "PHONE" | "SMS" | "EMAIL" | null;
  created_at: string;
}

export interface ActionResult {
  ok: boolean;
  error: string | null;
}

export async function addCrisisNote(
  clientId: string,
  note: string,
  contactMethod: "PHONE" | "SMS" | "EMAIL" | null,
  encryptedContent?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo: configurează Supabase pentru a persista notele." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_crisis_notes").insert({
    client_id: clientId,
    note: encryptedContent ? "[CONȚINUT CRIPTAT]" : note.trim(),
    encrypted_content: encryptedContent ?? null,
    contact_method: contactMethod ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients`);
  return { ok: true, error: null };
}

export async function listCrisisNotes(clientId: string): Promise<CrisisNote[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_crisis_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as CrisisNote[];
}

export async function deleteCrisisNote(noteId: string, clientId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_crisis_notes")
    .delete()
    .eq("id", noteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true, error: null };
}
