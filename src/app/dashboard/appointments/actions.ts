"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentFormState } from "@/lib/appointments/form-state";
import type { AppointmentStatus } from "@/lib/appointments/helpers";
import { pushAppointmentToGoogle } from "@/lib/google/sync";

function parseForm(formData: FormData) {
  const location = String(formData.get("location") ?? "PRIVAT");
  const meetLink = String(formData.get("meet_link") ?? "").trim();

  return {
    client_id: String(formData.get("client_id") ?? "").trim(),
    appointment_date: String(formData.get("appointment_date") ?? "").trim(),
    duration_minutes: parseInt(String(formData.get("duration_minutes") ?? "50"), 10),
    status: String(formData.get("status") ?? "PROGRAMAT").trim(),
    // derive DB fields from location
    is_external_duty: location === "POLICLINIC",
    meet_link: location === "ONLINE" ? meetLink || null : null,
    location,
  };
}

function validate(
  payload: ReturnType<typeof parseForm>,
): AppointmentFormState {
  const fieldErrors: AppointmentFormState["fieldErrors"] = {};

  if (!payload.client_id) fieldErrors.client_id = "Selectează un client.";
  if (!payload.appointment_date)
    fieldErrors.appointment_date = "Data și ora sunt obligatorii.";
  if (isNaN(payload.duration_minutes) || payload.duration_minutes < 10)
    fieldErrors.duration_minutes = "Durata minimă este 10 minute.";
  if (payload.location === "ONLINE" && !payload.meet_link)
    fieldErrors.meet_link = "Link Google Meet obligatoriu pentru sesiuni online.";

  return {
    error: Object.keys(fieldErrors).length ? "Verifică câmpurile marcate." : null,
    fieldErrors,
  };
}

export async function createAppointment(
  _prev: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation;

  if (!isSupabaseConfigured()) {
    return {
      error: "Mod demo: configurează Supabase pentru a salva programările.",
      fieldErrors: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      client_id: payload.client_id,
      appointment_date: new Date(payload.appointment_date).toISOString(),
      duration_minutes: payload.duration_minutes,
      status: payload.status,
      is_external_duty: payload.is_external_duty,
      meet_link: payload.meet_link,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, fieldErrors: {} };

  // Fire-and-forget: sync to Google Calendar (safe if not connected)
  pushAppointmentToGoogle(data.id).catch((e) =>
    console.warn("[GCal] sync skipped:", e)
  );

  revalidatePath("/dashboard/appointments");
  redirect(`/dashboard/appointments/${data.id}`);
}

export async function updateAppointment(
  id: string,
  _prev: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation;

  if (!isSupabaseConfigured()) {
    return {
      error: "Mod demo: configurează Supabase pentru a salva modificările.",
      fieldErrors: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      client_id: payload.client_id,
      appointment_date: new Date(payload.appointment_date).toISOString(),
      duration_minutes: payload.duration_minutes,
      status: payload.status,
      is_external_duty: payload.is_external_duty,
      meet_link: payload.meet_link,
    })
    .eq("id", id);

  if (error) return { error: error.message, fieldErrors: {} };

  // Fire-and-forget: sync any changes to Google Calendar
  pushAppointmentToGoogle(id).catch((e) =>
    console.warn("[GCal] sync skipped:", e)
  );

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
  redirect(`/dashboard/appointments/${id}`);
}

export async function updateAppointmentStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;

  if (!isSupabaseConfigured()) {
    redirect(`/dashboard/appointments/${id}?demo=1`);
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("appointments").update({ status }).eq("id", id);

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
  redirect(`/dashboard/appointments/${id}`);
}
