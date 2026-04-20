"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveNoteResult {
  ok: boolean;
  error: string | null;
}

/**
 * Persists the already-encrypted ciphertext. The server never sees plaintext.
 * If a row exists for this appointment we UPDATE it; otherwise INSERT.
 */
export async function saveEncryptedNote(
  appointmentId: string,
  ciphertext: string,
): Promise<SaveNoteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Mod demo: configurează Supabase pentru a persista notele.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("notes")
      .update({ encrypted_content: ciphertext, updated_at: now })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("notes").insert({
      appointment_id: appointmentId,
      encrypted_content: ciphertext,
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/dashboard/notes`);
  revalidatePath(`/dashboard/notes/${appointmentId}`);
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  return { ok: true, error: null };
}
