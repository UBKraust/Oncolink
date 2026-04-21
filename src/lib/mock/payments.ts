// Mock financial history per client: sessions + payments
// Generated dynamically for 3 months to support demo analytics

import { mockClients } from "./clients";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "B2B_FACTURA";
export type InvoiceStatus = "EMISĂ" | "ACHITATĂ" | "ANULATĂ" | "NEEMISĂ";

export interface MockSessionPayment {
  id: string;
  client_id: string;
  appointment_date: string;
  duration_minutes: number;
  amount: number;
  currency: "RON";
  payment_method: PaymentMethod;
  invoice_status: InvoiceStatus;
  invoice_number: string | null;
  notes: string | null;
}

function generateMockPayments(): MockSessionPayment[] {
  const payments: MockSessionPayment[] = [];
  const now = new Date();
  
  // Start from 3 months ago (roughly 90 days)
  const startDate = new Date();
  startDate.setDate(now.getDate() - 95);

  let idCounter = 1;

  mockClients.forEach((client) => {
    // Determine frequency
    let freqDays = 7; // Default SAPTAMANAL
    if (client.session_frequency === "BILUNAR") freqDays = 14;
    else if (client.session_frequency === "LUNAR") freqDays = 30;
    else if (client.session_frequency === "OCAZIONAL") freqDays = 45;

    const price = client.session_price ? parseFloat(client.session_price) : 200;
    
    // Generate sessions from start date until now
    let current = new Date(startDate);
    // Add a random offset for each client so they don't all have sessions on the same day
    current.setDate(current.getDate() + Math.floor(Math.random() * freqDays));

    while (current <= now) {
      // Randomize hour (9 AM - 6 PM)
      const dateStr = new Date(current);
      dateStr.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0);

      // Randomize status
      const rand = Math.random();
      let status: InvoiceStatus = "ACHITATĂ"; // 80%
      if (rand > 0.8 && rand < 0.95) status = "EMISĂ";
      else if (rand >= 0.95) status = "NEEMISĂ";

      // Randomize payment method
      const methods: PaymentMethod[] = ["CASH", "CARD", "TRANSFER"];
      if (client.billing_type === "B2B_COMPANY") methods.push("B2B_FACTURA");
      const method = methods[Math.floor(Math.random() * methods.length)];

      payments.push({
        id: `p-${String(idCounter++).padStart(3, "0")}`,
        client_id: client.id,
        appointment_date: dateStr.toISOString(),
        duration_minutes: 50,
        amount: price,
        currency: "RON",
        payment_method: client.billing_type === "B2B_COMPANY" ? "B2B_FACTURA" : method,
        invoice_status: status,
        invoice_number: status === "NEEMISĂ" ? null : `SB-2023-${String(100+idCounter).padStart(3, "0")}`,
        notes: Math.random() > 0.9 ? "Ședință demo" : null,
      });

      // Move to next session
      current.setDate(current.getDate() + freqDays);
      // Add small jitter (+/- 1 day)
      current.setDate(current.getDate() + (Math.random() > 0.5 ? 1 : -1));
    }
  });

  return payments;
}

export const mockPayments: MockSessionPayment[] = generateMockPayments();
