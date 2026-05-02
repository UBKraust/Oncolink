import { NextRequest, NextResponse } from "next/server";

import { getValidAccessToken } from "@/lib/google/sync";
import { uploadFileToDriveFolder } from "@/lib/google/drive";
import type { TemplateType } from "@/lib/contracts/types";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientId = String(formData.get("clientId") ?? "");
    const generatedContractId = String(formData.get("generatedContractId") ?? "");
    const contractNumber = String(formData.get("contractNumber") ?? "");
    const templateType = String(formData.get("templateType") ?? "") as TemplateType;
    const templateVersion = String(formData.get("templateVersion") ?? "").trim();

    if (!file || !clientId || !generatedContractId || !contractNumber || !templateType) {
      return NextResponse.json(
        { error: "Fișierul, clientId, generatedContractId, contractNumber și templateType sunt obligatorii." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Doar fișierele PDF sunt acceptate." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contractRow, error: contractError } = await supabase
      .from("generated_contracts")
      .select("id, client_id, contract_number")
      .eq("id", generatedContractId)
      .eq("client_id", clientId)
      .eq("therapist_id", user.id)
      .single();

    if (contractError || !contractRow) {
      return NextResponse.json({ error: contractError?.message || "Contract inexistent." }, { status: 404 });
    }

    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("full_name, contract_url")
      .eq("id", clientId)
      .eq("therapist_id", user.id)
      .single();

    if (clientError || !clientRow) {
      return NextResponse.json({ error: clientError?.message || "Client inexistent." }, { status: 404 });
    }

    const safeBaseName = sanitizeFileName(
      `${contractNumber}_${templateType}_${clientRow.full_name || clientId}.pdf`,
    );
    const storagePath = `${clientId}/${generatedContractId}_${safeBaseName}`;

    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const signedUrl = await createSignedObjectUrl(supabase, "patient-documents", storagePath);

    let driveFileId: string | null = null;
    let driveUrl: string | null = null;
    const folderMatch = clientRow.contract_url?.match(/folders\/([a-zA-Z0-9_-]+)/);
    const parentFolderId = folderMatch?.[1] ?? null;

    if (parentFolderId) {
      try {
        const accessToken = await getValidAccessToken();
        if (accessToken) {
          const uploaded = await uploadFileToDriveFolder(accessToken, file, safeBaseName, parentFolderId);
          driveFileId = uploaded.id;
          driveUrl = uploaded.webViewLink;
        }
      } catch (driveErr) {
        console.warn("[Generated Contract] Drive upload skipped:", driveErr);
      }
    }

    const { data: patientDocument, error: patientDocumentError } = await supabase
      .from("patient_documents")
      .insert({
        therapist_id: user.id,
        client_id: clientId,
        file_name: safeBaseName,
        file_size_kb: Math.round(file.size / 1024),
        mime_type: "application/pdf",
        storage_path: storagePath,
        drive_file_id: driveFileId,
        document_url: driveUrl,
        document_type: "CONTRACT",
        notes: `Contract ${contractNumber} (${templateType}${templateVersion ? `, ${templateVersion}` : ""}) generat din aplicație.`,
      })
      .select("id")
      .single();

    if (patientDocumentError || !patientDocument) {
      return NextResponse.json(
        { error: patientDocumentError?.message || "Nu am putut salva documentul contractului." },
        { status: 500 },
      );
    }

    const publicDocumentUrl = driveUrl ?? signedUrl ?? null;

    const { error: updateGeneratedContractError } = await supabase
      .from("generated_contracts")
      .update({
        patient_document_id: patientDocument.id,
        document_url: publicDocumentUrl,
        drive_file_id: driveFileId,
      })
      .eq("id", generatedContractId)
      .eq("therapist_id", user.id);

    if (updateGeneratedContractError) {
      return NextResponse.json({ error: updateGeneratedContractError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      generated_contract_id: generatedContractId,
      patient_document_id: patientDocument.id,
      document_url: publicDocumentUrl,
      drive_file_id: driveFileId,
      storage_path: storagePath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eroare internă." },
      { status: 500 },
    );
  }
}
