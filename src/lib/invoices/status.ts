export const CANONICAL_INVOICE_STATUSES = [
  "EMISĂ",
  "PLĂTITĂ",
  "RESTANTĂ",
  "ANULATĂ",
] as const;

export type CanonicalInvoiceStatus =
  (typeof CANONICAL_INVOICE_STATUSES)[number];

const LEGACY_TO_CANONICAL_STATUS: Record<string, CanonicalInvoiceStatus> = {
  ACHITATĂ: "PLĂTITĂ",
};

export function normalizeInvoiceStatus(
  status: string | null | undefined,
): CanonicalInvoiceStatus | string | null {
  if (!status) return null;
  return LEGACY_TO_CANONICAL_STATUS[status] ?? status;
}

export function isPaidInvoiceStatus(status: string | null | undefined) {
  return normalizeInvoiceStatus(status) === "PLĂTITĂ";
}
