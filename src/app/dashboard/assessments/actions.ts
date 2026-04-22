"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveAssessmentResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function saveAssessmentAction({
  clientId,
  assessmentType,
  scoringData,
  contentSummary,
  encryptedContent,
}: {
  clientId: string;
  assessmentType: string;
  scoringData: any;
  contentSummary: string;
  encryptedContent?: string;
}): Promise<SaveAssessmentResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("assessments").insert({
    client_id: clientId,
    assessment_type: assessmentType,
    scoring_data: scoringData,
    content_summary: encryptedContent ? "[CONȚINUT CRIPTAT]" : contentSummary,
    encrypted_content: encryptedContent ?? null,
  }).select("id").single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true, id: data.id };
}
