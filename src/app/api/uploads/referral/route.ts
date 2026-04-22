// POST /api/uploads/referral
// Accepts multipart/form-data with: file, clientId, referralNumber, referralDate, doctorCode, diagnosisCode
// Uploads to Google Drive (if connected) then saves metadata to Supabase

import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google/sync";
import { uploadDocumentToDrive } from "@/lib/google/drive";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

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

    let driveFileId: string | null = null;
    let documentUrl: string | null = null;

    // ── Try Google Drive upload ──────────────────────────────────────────────
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
        const safeName = `bilet_trimitere_${referralNumber ?? clientId}_${Date.now()}.${file.name.split(".").pop()}`;
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
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("referral_documents")
        .insert({
          client_id: clientId,
          appointment_id: appointmentId ?? null,
          file_name: file.name,
          drive_file_id: driveFileId,
          document_url: documentUrl,
          referral_number: referralNumber,
          referral_date: referralDate ?? null,
          referring_doctor_code: doctorCode,
          diagnosis_code_cim10: diagnosisCode,
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
        document_url: documentUrl,
        stored_in_drive: !!driveFileId,
      });
    }

    // ── Demo mode (no Supabase) ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      id: `demo-${Date.now()}`,
      drive_file_id: driveFileId,
      document_url: documentUrl,
      stored_in_drive: !!driveFileId,
      demo: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare internă";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
