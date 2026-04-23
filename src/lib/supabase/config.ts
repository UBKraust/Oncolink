/**
 * Single source of truth for whether Supabase is configured.
 * When false, the app runs in "demo/preview mode": auth guard is bypassed,
 * login is disabled, and UI shows a banner prompting to fill .env.local.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
