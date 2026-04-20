import type { Database } from "@/lib/supabase/types";

export type MockInvoice = Database["public"]["Tables"]["invoices"]["Row"];

const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const mockInvoices: MockInvoice[] = [
  {
    id: "inv-001",
    appointment_id: "ap-1007",
    client_name: "Ana Popescu",
    smartbill_series: "PSIH",
    smartbill_number: "0001",
    amount: 250,
    status: "PLĂTITĂ",
    smartbill_id: "sb-demo-001",
    payment_link: null,
    pdf_url: null,
    issued_at: iso(7),
  },
  {
    id: "inv-002",
    appointment_id: "ap-1001",
    client_name: "Ana Popescu",
    smartbill_series: "PSIH",
    smartbill_number: "0002",
    amount: 250,
    status: "EMISĂ",
    smartbill_id: "sb-demo-002",
    payment_link: "https://pay.smartbill.ro/demo-link-002",
    pdf_url: null,
    issued_at: iso(0),
  },
  {
    id: "inv-003",
    appointment_id: "ap-1008",
    client_name: "Mihai Ionescu",
    smartbill_series: "PSIH",
    smartbill_number: "0003",
    amount: 250,
    status: "RESTANTĂ",
    smartbill_id: "sb-demo-003",
    payment_link: "https://pay.smartbill.ro/demo-link-003",
    pdf_url: null,
    issued_at: iso(3),
  },
  {
    id: "inv-004",
    appointment_id: null,
    client_name: "Radu Stoica",
    smartbill_series: "PSIH",
    smartbill_number: "0004",
    amount: 300,
    status: "PLĂTITĂ",
    smartbill_id: "sb-demo-004",
    payment_link: null,
    pdf_url: null,
    issued_at: iso(14),
  },
];
