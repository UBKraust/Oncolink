import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

export function isHoneypotTriggered(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export interface RateLimitOptions {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

export async function enforceRateLimit({
  action,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: true };
  }

  const admin = createSupabaseServiceClient();
  const now = new Date();
  const bucketKey = await sha256Hex(`${action}:${identifier}`);
  const { data: existing } = await admin
    .from("public_request_rate_limits")
    .select("bucket_key, hits, window_expires_at")
    .eq("bucket_key", bucketKey)
    .maybeSingle();

  if (
    existing?.window_expires_at &&
    new Date(existing.window_expires_at).getTime() > now.getTime()
  ) {
    const nextHits = (existing.hits ?? 0) + 1;
    if (nextHits > limit) {
      const retryAfterMs =
        new Date(existing.window_expires_at).getTime() - now.getTime();
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    await admin
      .from("public_request_rate_limits")
      .update({
        hits: nextHits,
        updated_at: now.toISOString(),
      })
      .eq("bucket_key", bucketKey);

    return { ok: true };
  }

  await admin.from("public_request_rate_limits").upsert({
    bucket_key: bucketKey,
    action,
    hits: 1,
    window_started_at: now.toISOString(),
    window_expires_at: new Date(now.getTime() + windowMs).toISOString(),
    updated_at: now.toISOString(),
  });

  return { ok: true };
}
