/**
 * Resend Email client — fetch-only, edge-compatible.
 */

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string } | { error: any }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Mail] RESEND_API_KEY is not configured.");
    return { error: "Email service not configured." };
  }

  const from = params.from || process.env.MAIL_FROM || "Ce`ai Pățit? <notifications@oncolink.ro>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("[Mail] Resend error:", error);
      return { error };
    }

    return await res.json();
  } catch (err) {
    console.error("[Mail] Unexpected error:", err);
    return { error: err instanceof Error ? err.message : "Unexpected mail error" };
  }
}

/**
 * Onboarding Email Template
 */
export function onboardingEmailTemplate(clientName: string, onboardingLink: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background-color: #e11d48; color: white; padding: 12px; border-radius: 16px; margin-bottom: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
        <h2 style="margin: 0; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase; font-size: 20px;">Ce\`ai Pățit? — Management Cabinet</h2>
      </div>
      
      <p style="font-size: 16px; font-weight: bold;">Bună ziua, ${clientName},</p>
      
      <p>Te rugăm să completezi formularul de înrolare necesar pentru începerea procesului terapeutic. Acesta include acordul GDPR și datele administrative pentru contractare.</p>
      
      <div style="margin: 40px 0; text-align: center;">
        <a href="${onboardingLink}" style="background-color: #e11d48; color: white; padding: 16px 32px; border-radius: 100px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2);">
          Completează Formularul
        </a>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">Dacă butonul de mai sus nu funcționează, poți copia și accesa următorul link în browser:</p>
      <p style="font-size: 12px; color: #e11d48; word-break: break-all;">${onboardingLink}</p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
      
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">
        Acest email a fost trimis automat de către platforma Ce\`ai Pățit?.<br/>
        Informațiile tale sunt securizate și procesate conform normelor GDPR.
      </p>
    </div>
  `;
}
