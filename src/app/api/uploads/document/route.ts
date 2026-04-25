// POST /api/uploads/document
// Uploads a patient document to the client's Drive folder, saves metadata to Supabase

import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google/sync";
import { uploadFileToDriveFolder } from "@/lib/google/drive";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";

export const runtime = "edge";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const documentType = (formData.get("documentType") as string | null) ?? "ALTELE";
    const notes = formData.get("notes") as string | null;

    if (!file || !clientId) {
      return NextResponse.json({ error: "Fișierul și clientId sunt obligatorii." }, { status: 400 });
    }

    const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Tip fișier neacceptat." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fișierul depășește 10MB." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let driveFileId: string | null = null;
    let documentUrl: string | null = null;
    let storagePath: string | null = null;

    // ── Find client's Drive folder from Supabase ───────────────────────────────
    let parentFolderId: string | null = null;

    if (isSupabaseConfigured()) {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("contract_url")
        .eq("id", clientId)
        .eq("therapist_id", user.id)
        .single();

      if (!clientRow) {
        return NextResponse.json({ error: "Client inexistent sau inaccesibil." }, { status: 404 });
      }

      // contract_url holds the Drive FOLDER url — extract folder id
      if (clientRow?.contract_url) {
        const match = clientRow.contract_url.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) parentFolderId = match[1];
      }
    }

    // ── Upload to Supabase Storage ───────────────────────────────────────────
    const safeName = sanitizeFileName(`[${documentType}]_${Date.now()}_${file.name}`);
    storagePath = `${clientId}/${safeName}`;

    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const signedStorageUrl = await createSignedObjectUrl(supabase, "patient-documents", storagePath);

    // ── Upload to Drive ────────────────────────────────────────────────────────
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken && parentFolderId) {
        const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
        const driveName = `[${documentType}] ${file.name}`;
        const uploaded = await uploadFileToDriveFolder(accessToken, fileBlob, driveName, parentFolderId);
        driveFileId = uploaded.id;
        documentUrl = uploaded.webViewLink;
      }
    } catch (driveErr) {
      console.warn("[Document Upload] Drive unavailable:", driveErr);
    }

    // ── Save to Supabase ───────────────────────────────────────────────────────
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("patient_documents")
        .insert({
          therapist_id: user.id,
          client_id: clientId,
          file_name: file.name,
          file_size_kb: Math.round(file.size / 1024),
          mime_type: file.type,
          storage_path: storagePath,
          drive_file_id: driveFileId,
          document_url: documentUrl ?? signedStorageUrl,
          document_type: documentType,
          notes,
        })
        .select("id")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({
        success: true,
        id: data.id,
        document_url: documentUrl ?? signedStorageUrl,
        stored_in_drive: !!driveFileId,
        stored_in_storage: !!storagePath,
      });
    }

    // Demo mode
    return NextResponse.json({
      success: true,
      id: `demo-${Date.now()}`,
      document_url: documentUrl ?? signedStorageUrl,
      stored_in_drive: !!driveFileId,
      stored_in_storage: !!storagePath,
      demo: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare internă" },
      { status: 500 }
    );
  }
}
