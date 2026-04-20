// Mock financial history per client: sessions + payments

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

const d = (daysAgo: number, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

export const mockPayments: MockSessionPayment[] = [
  // ── Ana Popescu (c-001) — săptămânal, 250 RON, cash ─────────────────────────
  { id: "p-001", client_id: "c-001", appointment_date: d(7),  duration_minutes: 50, amount: 250, currency: "RON", payment_method: "CASH",      invoice_status: "NEEMISĂ",  invoice_number: null,       notes: null },
  { id: "p-002", client_id: "c-001", appointment_date: d(14), duration_minutes: 50, amount: 250, currency: "RON", payment_method: "CASH",      invoice_status: "NEEMISĂ",  invoice_number: null,       notes: null },
  { id: "p-003", client_id: "c-001", appointment_date: d(21), duration_minutes: 50, amount: 250, currency: "RON", payment_method: "CASH",      invoice_status: "NEEMISĂ",  invoice_number: null,       notes: "Ședință recuperare" },
  { id: "p-004", client_id: "c-001", appointment_date: d(28), duration_minutes: 50, amount: 250, currency: "RON", payment_method: "TRANSFER",  invoice_status: "ACHITATĂ", invoice_number: "SB-2025-041", notes: null },
  { id: "p-005", client_id: "c-001", appointment_date: d(35), duration_minutes: 50, amount: 250, currency: "RON", payment_method: "CASH",      invoice_status: "NEEMISĂ",  invoice_number: null,       notes: null },
  { id: "p-006", client_id: "c-001", appointment_date: d(42), duration_minutes: 50, amount: 250, currency: "RON", payment_method: "CASH",      invoice_status: "NEEMISĂ",  invoice_number: null,       notes: null },

  // ── Mihai Ionescu (c-002) — bilunar, 300 RON, B2B facturat lunar ─────────────
  { id: "p-010", client_id: "c-002", appointment_date: d(5),  duration_minutes: 50, amount: 300, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "EMISĂ",   invoice_number: "SB-2025-050", notes: null },
  { id: "p-011", client_id: "c-002", appointment_date: d(19), duration_minutes: 50, amount: 300, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-038", notes: null },
  { id: "p-012", client_id: "c-002", appointment_date: d(33), duration_minutes: 50, amount: 300, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-025", notes: "Luna martie / Tech Solutions SRL" },
  { id: "p-013", client_id: "c-002", appointment_date: d(47), duration_minutes: 50, amount: 300, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-010", notes: null },

  // ── Andrei Dumitrescu (c-003) — minor, săptămânal, 200 RON ─────────────────
  { id: "p-020", client_id: "c-003", appointment_date: d(6),  duration_minutes: 50, amount: 200, currency: "RON", payment_method: "CASH",  invoice_status: "NEEMISĂ",  invoice_number: null, notes: "Achitat de mamă" },
  { id: "p-021", client_id: "c-003", appointment_date: d(13), duration_minutes: 50, amount: 200, currency: "RON", payment_method: "CASH",  invoice_status: "NEEMISĂ",  invoice_number: null, notes: null },
  { id: "p-022", client_id: "c-003", appointment_date: d(20), duration_minutes: 50, amount: 200, currency: "RON", payment_method: "CARD",  invoice_status: "ACHITATĂ", invoice_number: "SB-2025-048", notes: null },

  // ── Radu Stoica (c-004) — ocazional, preț negociat ────────────────────────
  { id: "p-030", client_id: "c-004", appointment_date: d(15), duration_minutes: 80, amount: 350, currency: "RON", payment_method: "CARD",     invoice_status: "ACHITATĂ", invoice_number: "SB-2025-040", notes: "Ședință extinsă 80 min" },
  { id: "p-031", client_id: "c-004", appointment_date: d(45), duration_minutes: 50, amount: 300, currency: "RON", payment_method: "TRANSFER", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-022", notes: null },
  { id: "p-032", client_id: "c-004", appointment_date: d(90), duration_minutes: 50, amount: 300, currency: "RON", payment_method: "CARD",     invoice_status: "ANULATĂ",  invoice_number: "SB-2025-005", notes: "Factură anulată - rescheduled" },

  // ── Ioana Marin (c-005) — B2B Creative Agency, săptămânal ─────────────────
  { id: "p-040", client_id: "c-005", appointment_date: d(3),  duration_minutes: 50, amount: 350, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "EMISĂ",   invoice_number: "SB-2025-052", notes: null },
  { id: "p-041", client_id: "c-005", appointment_date: d(10), duration_minutes: 50, amount: 350, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "EMISĂ",   invoice_number: "SB-2025-051", notes: null },
  { id: "p-042", client_id: "c-005", appointment_date: d(17), duration_minutes: 50, amount: 350, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-039", notes: null },
  { id: "p-043", client_id: "c-005", appointment_date: d(24), duration_minutes: 50, amount: 350, currency: "RON", payment_method: "B2B_FACTURA", invoice_status: "ACHITATĂ", invoice_number: "SB-2025-030", notes: "Facturat lunar - luna martie" },
];
