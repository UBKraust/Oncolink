"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import { logAuditEvent } from "@/lib/audit/log";

export type VaultCategory =
  | "DIPLOME"
  | "CERTIFICARI"
  | "CABINET_ACTE"
  | "UTILITATI"
  | "CONTRACTE"
  | "ASIGURARE"
  | "ALTE";

export interface VaultDoc {
  id: string;
  name: string;
  category: VaultCategory;
  file_url: string;
  download_url?: string | null;
  file_path: string | null;
  expiry_date: string | null;
  uploaded_at: string;
}

export interface VaultActionResult {
  ok: boolean;
  error?: string;
  doc?: VaultDoc;
}

export async function listVaultDocuments(): Promise<VaultDoc[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("therapist_documents")
    .select("*")
    .eq("therapist_id", user.user.id)
    .order("category")
    .order("uploaded_at", { ascending: false });

  if (error) return [];

  const docs = ((data ?? []) as VaultDoc[]);
  return Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      download_url: `/api/documents/vault/${doc.id}/download`,
      file_url:
        (await createSignedObjectUrl(
          supabase,
          "therapist-vault",
          doc.file_path,
        )) ?? doc.file_url,
    })),
  );
}

export async function uploadVaultDocument(
  formData: FormData,
): Promise<VaultActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo: configurează Supabase." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: "Neautentificat." };

  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string | null)?.trim();
  const category = formData.get("category") as VaultCategory | null;
  const expiryDate = (formData.get("expiry_date") as string | null) || null;

  if (!file || !name || !category) {
    return { ok: false, error: "Fișier, nume și categorie sunt obligatorii." };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: "Fișierul depășește limita de 20 MB." };
  }

  // Unique path to prevent collisions
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 80);
  const filePath = `${authData.user.id}/${Date.now()}_${safeName}`;

  const { error: storageError } = await supabase.storage
    .from("therapist-vault")
    .upload(filePath, file, {
      contentType: file.type || `application/${ext}`,
      upsert: false,
    });

  if (storageError) return { ok: false, error: storageError.message };

  const fileUrl =
    (await createSignedObjectUrl(supabase, "therapist-vault", filePath)) ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: dbError } = await (supabase as any)
    .from("therapist_documents")
    .insert({
      therapist_id: authData.user.id,
      name,
      category,
      file_url: fileUrl,
      file_path: filePath,
      expiry_date: expiryDate || null,
    })
    .select("*")
    .single();

  if (dbError) {
    // Clean up uploaded file on DB error
    await supabase.storage.from("therapist-vault").remove([filePath]);
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/dashboard/vault");
  return { ok: true, doc: inserted as VaultDoc };
}

export async function deleteVaultDocument(
  id: string,
): Promise<VaultActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Mod demo." };

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: "Neautentificat." };

  // Fetch to get file_path before deletion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc } = await (supabase as any)
    .from("therapist_documents")
    .select("file_path")
    .eq("id", id)
    .eq("therapist_id", authData.user.id)
    .maybeSingle() as { data: { file_path: string | null } | null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("therapist_documents")
    .delete()
    .eq("id", id)
    .eq("therapist_id", authData.user.id);

  if (error) return { ok: false, error: error.message };

  // Remove from storage
  if (doc?.file_path) {
    await supabase.storage
      .from("therapist-vault")
      .remove([doc.file_path])
      .catch(() => {});
  }

  void logAuditEvent({
    action: 'DOCUMENT_DELETED',
    category: 'DELETE',
    entityType: 'document',
    entityId: id,
    severity: 'CRITICAL',
    metadata: { bucket: 'therapist-vault', file_path: doc?.file_path ?? null },
  })

  revalidatePath("/dashboard/vault");
  return { ok: true };
}
