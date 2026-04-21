"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { TestTemplate } from "@/lib/assessments/types";

export async function saveTestTemplate(test: Omit<TestTemplate, "id" | "created_at">) {
  const configured = isSupabaseConfigured();
  
  if (!configured) {
    console.log("[TestActions] Supabase NOT configured. Mocking success for demo.");
    return { success: true };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current therapist ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Trebuie să fii autentificat.");

    const { data, error } = await supabase
      .from("psychological_tests")
      .insert({
        name: test.name,
        description: test.description,
        questions: test.questions,
        scoring_logic: test.scoring_logic,
        therapist_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/tests");
    return { success: true, test: data };
  } catch (err) {
    console.error("[SaveTestError]", err);
    return { error: err instanceof Error ? err.message : "Eroare la salvarea testului." };
  }
}
