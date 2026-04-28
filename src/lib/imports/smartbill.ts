import { z } from "zod";

export const ImportedInvoiceSchema = z.object({
  series: z.string().optional().default("SB"),
  number: z.string().min(1, "Numărul facturii este obligatoriu."),
  date: z.string().min(1, "Data facturii este obligatorie."),
  client_name: z.string().optional().default(""),
  total: z.string().min(1, "Totalul facturii este obligatoriu."),
  status: z.string().optional().default("EMISĂ"),
});

export const ImportedExpenseSchema = z.object({
  number: z.string().optional().default(""),
  date: z.string().min(1, "Data cheltuielii este obligatorie."),
  supplier: z.string().optional().default(""),
  total: z.string().min(1, "Totalul cheltuielii este obligatoriu."),
  category: z.string().optional().default("ALTE"),
});

export const InvoiceImportPayloadSchema = z.object({
  invoices: z.array(ImportedInvoiceSchema),
});

export const ExpenseImportPayloadSchema = z.object({
  expenses: z.array(ImportedExpenseSchema),
});

export type ImportedInvoice = z.infer<typeof ImportedInvoiceSchema>;
export type ImportedExpense = z.infer<typeof ImportedExpenseSchema>;

function parseLocalizedAmount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number.parseFloat(normalized);
}

export function normalizeImportedInvoice(invoice: ImportedInvoice) {
  const amount = parseLocalizedAmount(invoice.total);
  if (!Number.isFinite(amount)) {
    throw new Error(`Total invalid pentru factura ${invoice.number}.`);
  }

  const issuedAt = new Date(invoice.date);
  if (Number.isNaN(issuedAt.getTime())) {
    throw new Error(`Data invalidă pentru factura ${invoice.number}.`);
  }

  return {
    series: invoice.series || "SB",
    number: invoice.number,
    dateIso: issuedAt.toISOString(),
    clientName: invoice.client_name.trim() || null,
    amount,
    status: invoice.status || "EMISĂ",
  };
}

export function normalizeImportedExpense(expense: ImportedExpense) {
  const amount = parseLocalizedAmount(expense.total);
  if (!Number.isFinite(amount)) {
    throw new Error(`Total invalid pentru cheltuiala ${expense.number || expense.supplier || "fără nume"}.`);
  }

  const expenseDate = new Date(expense.date);
  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error(`Data invalidă pentru cheltuiala ${expense.number || expense.supplier || "fără nume"}.`);
  }

  return {
    number: expense.number,
    supplier: expense.supplier.trim() || null,
    category: expense.category || "ALTE",
    amount,
    expenseDateIso: expenseDate.toISOString().slice(0, 10),
  };
}
