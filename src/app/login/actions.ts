"use server";

import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logAuditEvent, logAuditEventForActor } from "@/lib/audit/log";

function hashIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function signInWithPassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not_configured");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await logAuditEventForActor({
      therapistId: null,
      actorUserId: null,
      input: {
        action: "LOGIN_FAILED",
        category: "AUTH",
        severity: "WARNING",
        status: "FAILED",
        actorRole: "ANONYMOUS",
        ipAddress,
        userAgent,
        metadata: {
          email_hash: hashIdentifier(email),
          email_domain: email.split("@")[1] ?? "",
          reason: error.message,
        },
      },
    });
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  await logAuditEvent({
    action: 'LOGIN_SUCCESS',
    category: 'AUTH',
    severity: 'INFO',
    ipAddress,
    userAgent,
    metadata: { email_domain: email.split('@')[1] ?? '' },
  })

  redirect("/dashboard");
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
