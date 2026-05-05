import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error } = await (supabase as any)
    .from("therapist_documents")
    .select("id, name, file_url, file_path")
    .eq("id", id)
    .eq("therapist_id", user.id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: error?.message ?? "Document inexistent." }, { status: 404 });
  }

  const signedUrl = await createSignedObjectUrl(supabase, "therapist-vault", doc.file_path);
  const targetUrl = signedUrl ?? doc.file_url;

  if (!targetUrl) {
    return NextResponse.json({ error: "Fișierul nu mai are o locație accesibilă." }, { status: 404 });
  }

  void logAuditEvent({
    action: "DOCUMENT_DOWNLOADED",
    category: "DOCUMENT",
    entityType: "document",
    entityId: doc.id,
    severity: "CRITICAL",
    metadata: {
      file_name: doc.name,
      bucket: "therapist-vault",
      source: doc.file_path ? "supabase_storage" : "external_url",
    },
  });

  return NextResponse.redirect(targetUrl);
}
