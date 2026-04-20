/**
 * Google Calendar REST API client — fetch-only, edge-compatible.
 *
 * Token lifecycle:
 *   - Access token: short-lived (1h), stored in Supabase `therapist_settings`
 *   - Refresh token: long-lived, stored encrypted (same table)
 *   - refreshAccessToken() silently exchanges refresh → new access token
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GCAL_BASE = "https://www.googleapis.com/calendar/v3";

export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  return res.json() as Promise<GoogleTokens>;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export interface GCalEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  conferenceData?: {
    entryPoints?: Array<{ uri: string; entryPointType: string }>;
  };
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GCalEvent,
): Promise<{ id: string; hangoutLink?: string }> {
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );
  if (!res.ok) throw new Error(`GCal createEvent failed: ${res.status}`);
  return res.json() as Promise<{ id: string; hangoutLink?: string }>;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  patch: Partial<GCalEvent>,
): Promise<void> {
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) throw new Error(`GCal updateEvent failed: ${res.status}`);
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 410) {
    throw new Error(`GCal deleteEvent failed: ${res.status}`);
  }
}

export async function registerWebhook(
  accessToken: string,
  calendarId: string,
  webhookUrl: string,
  channelId: string,
): Promise<{ id: string; resourceId: string; expiration: string }> {
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN ?? "",
      }),
    },
  );
  if (!res.ok) throw new Error(`GCal watch failed: ${res.status}`);
  return res.json() as Promise<{ id: string; resourceId: string; expiration: string }>;
}

export async function listRecentEvents(
  accessToken: string,
  calendarId: string,
  updatedMin: string,
): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    updatedMin,
    singleEvents: "true",
    orderBy: "updated",
    maxResults: "250",
  });
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`GCal list failed: ${res.status}`);
  const data = (await res.json()) as { items?: GCalEvent[] };
  return data.items ?? [];
}
