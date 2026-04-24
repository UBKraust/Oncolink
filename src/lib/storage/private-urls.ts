import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

const DEFAULT_SIGNED_URL_TTL_SEC = 60 * 60;

type AppSupabaseClient = SupabaseClient<Database>;

export async function createSignedObjectUrl(
  supabase: AppSupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SEC,
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.warn(`[storage] Failed to sign ${bucket}/${path}:`, error.message);
    return null;
  }

  return data.signedUrl;
}
