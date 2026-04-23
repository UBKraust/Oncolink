import type { Database } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

export async function getNoteByAppointment(
  appointmentId: string,
): Promise<NoteRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listNotesMetadata(): Promise<
  Array<Pick<NoteRow, "id" | "appointment_id" | "updated_at" | "created_at">>
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id, appointment_id, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return data ?? [];
}
