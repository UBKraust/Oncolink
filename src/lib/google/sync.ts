/**
 * Google Calendar ↔ Ce`ai Pățit? bidirectional sync helpers.
 *
 * Outbound (Ce`ai Pățit? → Google):
 *   pushAppointmentToGoogle()  — create/update event
 *   deleteAppointmentFromGoogle() — cancel event
 *
 * Inbound (Google → Ce`ai Pățit?):
 *   reconcileFromGoogle()  — called after webhook fires; pulls recent events
 *   and updates appointment meet_link + google_event_id
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  listRecentEvents,
  refreshAccessToken,
  type GCalEvent,
} from "./client";

const TZ = "Europe/Bucharest";
const CALENDAR_ID = "primary";

/**
 * Retrieve stored tokens from DB and auto-refresh if expired.
 * Returns null if Google OAuth is not yet connected.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("therapist_settings" as never)
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .maybeSingle() as { data: {
      google_access_token: string | null;
      google_refresh_token: string | null;
      google_token_expires_at: string | null;
    } | null };

  if (!data?.google_refresh_token) return null;

  const expiresAt = data.google_token_expires_at
    ? new Date(data.google_token_expires_at)
    : new Date(0);

  if (data.google_access_token && expiresAt > new Date(Date.now() + 60_000)) {
    return data.google_access_token;
  }

  const refreshed = await refreshAccessToken(data.google_refresh_token);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);

  await supabase
    .from("therapist_settings" as never)
    .update({
      google_access_token: refreshed.access_token,
      google_token_expires_at: newExpiry.toISOString(),
    } as never)
    .eq("id" as never, 1 as never);

  return refreshed.access_token;
}

export async function pushAppointmentToGoogle(
  appointmentId: string,
): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;

  const supabase = await createSupabaseServerClient();
  const { data: a } = await supabase
    .from("appointments")
    .select("*, client:clients(full_name, email)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!a) return;

  const start = new Date(a.appointment_date);
  const end = new Date(start.getTime() + a.duration_minutes * 60_000);
  const client = a.client as { full_name: string | null; email: string | null } | null;

  const event: GCalEvent = {
    summary: a.is_external_duty
      ? "Gardă externă"
      : `Ședință · ${client?.full_name ?? "Client"}`,
    description: a.is_external_duty
      ? "Bloc gardă externă — ascuns din booking public."
      : `Client: ${client?.full_name ?? "—"}\nEmail: ${client?.email ?? "—"}`,
    start: { dateTime: start.toISOString(), timeZone: TZ },
    end: { dateTime: end.toISOString(), timeZone: TZ },
    reminders: {
      useDefault: !a.reminders_enabled,
      overrides: a.reminders_enabled
        ? [{ method: "popup", minutes: a.reminder_minutes ?? 60 }]
        : [],
    },
  };

  if (a.google_event_id) {
    await updateCalendarEvent(accessToken, CALENDAR_ID, a.google_event_id, event);
  } else {
    const created = await createCalendarEvent(accessToken, CALENDAR_ID, event);
    const meetLink = created.hangoutLink ?? null;
    await supabase
      .from("appointments")
      .update({
        google_event_id: created.id,
        ...(meetLink ? { meet_link: meetLink } : {}),
      })
      .eq("id", appointmentId);
  }
}

export async function deleteAppointmentFromGoogle(
  googleEventId: string,
): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;
  await deleteCalendarEvent(accessToken, CALENDAR_ID, googleEventId);
}

/**
 * Reconcile after a Google Calendar webhook fires.
 * - Updates meet_link when a conference link is present.
 * - Sets status = 'ANULAT' when the therapist deletes the event in Google Calendar.
 */
export async function reconcileFromGoogle(updatedMin: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;

  const events = await listRecentEvents(accessToken, CALENDAR_ID, updatedMin);
  if (!events.length) return;

  const supabase = await createSupabaseServerClient();

  for (const ev of events) {
    if (!ev.id) continue;

    const evWithStatus = ev as GCalEvent & { status?: string };

    // Event deleted or cancelled in Google Calendar → mark appointment ANULAT
    if (evWithStatus.status === "cancelled") {
      await supabase
        .from("appointments")
        .update({ status: "ANULAT" })
        .eq("google_event_id", ev.id)
        .in("status", ["PROGRAMAT", "CONFIRMAT"]);
      continue;
    }

    // Update meet_link if a video conference link is present
    const meetLink =
      ev.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video",
      )?.uri ?? null;

    if (meetLink) {
      await supabase
        .from("appointments")
        .update({ meet_link: meetLink })
        .eq("google_event_id", ev.id);
    }
  }
}
