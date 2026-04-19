/**
 * Validation helpers for Romanian CNP (personal ID, 13 digits with a check
 * digit) and CIF (company tax ID, with optional "RO" prefix).
 *
 * The CNP check digit uses constants [2,7,9,1,4,6,3,5,8,2,7,9]; sum mod 11,
 * mapping 10 → 1.
 */

const CNP_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9] as const;

export type CnpCifKind = "CNP" | "CIF" | "UNKNOWN";

export function detectKind(raw: string): CnpCifKind {
  const value = raw.replace(/\s/g, "").toUpperCase();
  if (/^\d{13}$/.test(value)) return "CNP";
  if (/^(RO)?\d{2,10}$/.test(value)) return "CIF";
  return "UNKNOWN";
}

export function isValidCNP(raw: string): boolean {
  const value = raw.replace(/\D/g, "");
  if (!/^\d{13}$/.test(value)) return false;

  const firstDigit = Number(value[0]);
  if (firstDigit < 1 || firstDigit > 8) return false;

  const month = Number(value.slice(3, 5));
  if (month < 1 || month > 12) return false;

  const day = Number(value.slice(5, 7));
  if (day < 1 || day > 31) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(value[i]) * CNP_WEIGHTS[i];
  const checksum = sum % 11 === 10 ? 1 : sum % 11;
  return checksum === Number(value[12]);
}

export function isValidCIF(raw: string): boolean {
  const value = raw.replace(/\s/g, "").replace(/^RO/i, "");
  return /^\d{2,10}$/.test(value);
}

export function validateCnpCif(raw: string): { ok: true } | { ok: false; reason: string } {
  const kind = detectKind(raw);
  if (kind === "CNP") {
    return isValidCNP(raw)
      ? { ok: true }
      : { ok: false, reason: "CNP invalid (cifră de control sau dată nașterii greșită)." };
  }
  if (kind === "CIF") {
    return isValidCIF(raw)
      ? { ok: true }
      : { ok: false, reason: "CIF invalid." };
  }
  return { ok: false, reason: "Format necunoscut. Introdu CNP (13 cifre) sau CIF." };
}

const ROMANIAN_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(raw: string): boolean {
  return ROMANIAN_EMAIL.test(raw.trim());
}

export function isValidRomanianPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  // Accept +40xxxxxxxxx (12 digits incl. country) or 0xxxxxxxxx (10 digits)
  return /^40\d{9}$/.test(digits) || /^0\d{9}$/.test(digits);
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => `${p[0]}.`.toUpperCase())
    .join("");
}
