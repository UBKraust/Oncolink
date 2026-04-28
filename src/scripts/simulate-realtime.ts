import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "@/lib/supabase/types";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function simulateUpdate() {
  console.log("🚀 Simulating database changes for Realtime testing...");

  // 1. Get a therapist ID (or use a default)
  const { data: settings } = await supabase
    .from("therapist_settings")
    .select("therapist_id")
    .limit(1)
    .single();
  const therapistId = settings?.therapist_id;

  if (!therapistId) {
    console.error("❌ No therapist_id found in therapist_settings. Please configure settings first.");
    return;
  }

  // 2. Add a temporary appointment
  console.log("📅 Adding a test appointment...");
  const { data: client } = await supabase.from("clients").select("id").limit(1).single();
  
  if (!client) {
    console.log("⚠️ No clients found. Skipping appointment simulation.");
  } else {
    const { data: newApp, error: appError } = await supabase
      .from("appointments")
      .insert({
        therapist_id: therapistId,
        client_id: client.id,
        appointment_date: new Date().toISOString(),
        duration_minutes: 50,
        status: "PROGRAMAT",
      })
      .select("id")
      .single();

    if (appError) {
      console.error("❌ Error creating appointment:", appError.message);
    } else {
      console.log("✅ Created test appointment:", newApp.id);
      
      // Wait 5 seconds then update it
      console.log("⏳ Waiting 5 seconds before updating status...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      console.log("🔄 Updating appointment status to FINALIZAT...");
      await supabase.from("appointments").update({ status: "FINALIZAT" }).eq("id", newApp.id);
      
      // Wait 5 seconds then delete it
      console.log("⏳ Waiting 5 seconds before deleting...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      console.log("🗑️ Deleting test appointment...");
      await supabase.from("appointments").delete().eq("id", newApp.id);
      console.log("✨ Simulation finished.");
    }
  }
}

void simulateUpdate();
