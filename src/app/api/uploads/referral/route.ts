// POST /api/uploads/referral
// Accepts multipart/form-data with: file, clientId, referralNumber, referralDate, doctorCode, diagnosisCode
// Uploads to Google Drive (if connected) then saves metadata to Supabase

import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google/sync";
import { uploadDocumentToDrive } from "@/lib/google/drive";
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
    const appointmentId = formData.get("appointmentId") as string | null;
    const referralNumber = formData.get("referralNumber") as string | null;
    const referralDate = formData.get("referralDate") as string | null;
    const doctorCode = formData.get("doctorCode") as string | null;
    const diagnosisCode = formData.get("diagnosisCode") as string | null;

    if (!file || !clientId) {
      return NextResponse.json(
        { error: "Fișierul și clientId sunt obligatorii." },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tip fișier neacceptat. Acceptăm: PDF, JPG, PNG." },
        { status: 400 }
      );
    }

    // Max size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fișierul depășește limita de 10MB." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: clientRow } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("therapist_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json({ error: "Client inexistent sau inaccesibil." }, { status: 404 });
    }

    if (appointmentId) {
      const { data: appointmentRow } = await supabase
        .from("appointments")
        .select("id")
        .eq("id", appointmentId)
        .eq("client_id", clientId)
        .eq("therapist_id", user.id)
        .single();

      if (!appointmentRow) {
        return NextResponse.json({ error: "Programare inexistentă sau inaccesibilă." }, { status: 404 });
      }
    }

    let driveFileId: string | null = null;
    let documentUrl: string | null = null;
    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = sanitizeFileName(`bilet_trimitere_${referralNumber ?? clientId}_${Date.now()}.${ext}`);
    const storagePath = `${clientId}/${safeName}`;

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

    // ── Try Google Drive upload ──────────────────────────────────────────────
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
        const uploaded = await uploadDocumentToDrive(accessToken, fileBlob, safeName, file.type);
        driveFileId = uploaded.id;
        documentUrl = uploaded.webViewLink;
      }
    } catch (driveErr) {
      // Drive upload failed — continue without it (file metadata still saved)
      console.warn("[Referral Upload] Google Drive unavailable:", driveErr);
    }

    // ── Save metadata to Supabase ────────────────────────────────────────────
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("referral_documents")
        .insert({
          therapist_id: user.id,
          client_id: clientId,
          appointment_id: appointmentId ?? null,
          file_name: file.name,
          drive_file_id: driveFileId,
          document_url: documentUrl,
          referral_number: referralNumber,
          referral_date: referralDate ?? null,
          referring_doctor_code: doctorCode,
          diagnosis_code_cim10: diagnosisCode,
          storage_path: storagePath,
          mime_type: file.type,
          file_size_kb: Math.round(file.size / 1024),
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        id: data.id,
        drive_file_id: driveFileId,
        document_url: documentUrl ?? signedStorageUrl,
        storage_path: storagePath,
        stored_in_drive: !!driveFileId,
        stored_in_storage: true,
      });
    }

    // ── Demo mode (no Supabase) ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      id: `demo-${Date.now()}`,
      drive_file_id: driveFileId,
      document_url: documentUrl ?? signedStorageUrl,
      storage_path: storagePath,
      stored_in_drive: !!driveFileId,
      stored_in_storage: true,
      demo: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare internă";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
