/**
 * localStorage-backed PIN state:
 * - salt: 16 random bytes (base64) — non-secret, needed to derive key
 * - canary: encrypted known plaintext — used to verify PIN on unlock
 *
 * If both are absent: no PIN has been set (first-time setup).
 * If present: user has a PIN; unlock is required.
 */

const KEY_SALT = "oncolink:notes:salt";
const KEY_CANARY = "oncolink:notes:canary";

export interface PinState {
  saltB64: string;
  canary: string;
}

export function readPinState(): PinState | null {
  if (typeof window === "undefined") return null;
  const saltB64 = localStorage.getItem(KEY_SALT);
  const canary = localStorage.getItem(KEY_CANARY);
  if (!saltB64 || !canary) return null;
  return { saltB64, canary };
}

export function writePinState(state: PinState) {
  localStorage.setItem(KEY_SALT, state.saltB64);
  localStorage.setItem(KEY_CANARY, state.canary);
}

export function clearPinState() {
  localStorage.removeItem(KEY_SALT);
  localStorage.removeItem(KEY_CANARY);
}
