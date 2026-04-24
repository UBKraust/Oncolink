import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client. Bypasses RLS — only use inside trusted server routes
 * (webhooks, cron jobs). Never import from a client component.
 */
export function createSupabaseServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }

  const { url, serviceRoleKey } = getSupabaseEnv();

  return createClient<Database>(
    url,
    serviceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
