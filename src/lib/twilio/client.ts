/**
 * Twilio REST API client — fetch-only, edge-compatible.
 *
 * Sends WhatsApp messages (via Twilio sandbox / approved sender) or SMS fallback.
 * Never import from client components.
 */

const TWILIO_BASE = "https://api.twilio.com/2010-04-01";

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  return "Basic " + btoa(`${sid}:${token}`);
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SMS_FROM)
  );
}

export type NotificationChannel = "whatsapp" | "sms";

export interface SendMessageParams {
  to: string;             // E.164 phone number
  body: string;
  channel?: NotificationChannel;
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const channel = params.channel ?? "whatsapp";

  const from =
    channel === "whatsapp"
      ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? ""}`
      : (process.env.TWILIO_SMS_FROM ?? "");

  const to =
    channel === "whatsapp" ? `whatsapp:${params.to}` : params.to;

  const res = await fetch(
    `${TWILIO_BASE}/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: params.body }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio error ${res.status}: ${text}`);
  }
}

// ─── Message templates ────────────────────────────────────────────────────────

export function bookingConfirmationMsg(
  clientName: string,
  dateRo: string,
  timeRo: string,
): string {
  return (
    `Bună ziua, ${clientName}!\n\n` +
    `Programarea ta a fost înregistrată pentru *${dateRo}* la ora *${timeRo}*.\n` +
    `Te așteptăm! 😊\n\n_Cabinet psihoterapie Ce\`ai Pățit?_`
  );
}

export function reminderMsg(
  clientName: string,
  dateRo: string,
  timeRo: string,
  confirmLink: string,
  cancelLink: string,
): string {
  return (
    `Bună ziua, ${clientName}!\n\n` +
    `Reminder: mâine ai o ședință la ora *${timeRo}* (${dateRo}).\n\n` +
    `✅ Confirmă: ${confirmLink}\n` +
    `❌ Anulează: ${cancelLink}\n\n` +
    `_Cabinet psihoterapie Ce\`ai Pățit?_`
  );
}

export function unpaidInvoiceMsg(
  clientName: string,
  invoiceRef: string,
  amountRON: number,
  paymentLink: string,
): string {
  return (
    `Bună ziua, ${clientName}!\n\n` +
    `Factura *${invoiceRef}* în valoare de *${amountRON.toFixed(2)} RON* este în așteptare.\n` +
    `Plătește online: ${paymentLink}\n\n` +
    `_Cabinet psihoterapie Ce\`ai Pățit?_`
  );
}

export function travelReminderMsg(
  appointmentTime: string,
  location: string,
): string {
  return (
    `🚗 Reminder deplasare:\n` +
    `Ședința la *${location}* este la ora *${appointmentTime}*.\n` +
    `Pleacă cu ~30 min înainte pentru buffer.\n\n` +
    `_Ce\`ai Pățit? — calendar intern_`
  );
}
