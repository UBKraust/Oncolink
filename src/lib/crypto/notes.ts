/**
 * Client-side cryptography for clinical notes.
 *
 * Design:
 * - Key derivation: PBKDF2(SHA-256, 200_000 iterations) from PIN + therapist
 *   salt. Salt is stored in localStorage (non-secret, must persist across
 *   sessions so the same PIN derives the same key).
 * - Encryption: AES-GCM 256-bit with a random 12-byte IV per message.
 * - Payload format: base64url( iv || ciphertext ) — IV is the first 12 bytes.
 * - PIN verification: a fixed canary string encrypted at PIN setup time.
 *   On unlock we try to decrypt the canary; if it round-trips to the known
 *   plaintext the PIN is correct. This is zero-knowledge: neither PIN nor key
 *   ever leave the browser.
 *
 * All of this runs in the browser only. Never import from server components.
 */

const PBKDF2_ITERATIONS = 200_000;
const KEY_LENGTH_BITS = 256;
const IV_LENGTH = 12;
const CANARY_PLAINTEXT = "cepaipatit-v1";
const SALT_LENGTH = 16;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export function saltToBase64(salt: Uint8Array): string {
  return toB64(salt);
}

export function saltFromBase64(b64: string): Uint8Array {
  return fromB64(b64);
}

export async function deriveNoteKey(
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptNote(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      textEncoder.encode(plaintext),
    ),
  );
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return toB64(combined);
}

export async function decryptNote(
  payload: string,
  key: CryptoKey,
): Promise<string> {
  const combined = fromB64(payload);
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext as BufferSource,
  );
  return textDecoder.decode(plain);
}

export async function makeCanary(key: CryptoKey): Promise<string> {
  return encryptNote(CANARY_PLAINTEXT, key);
}

export async function verifyCanary(
  encoded: string,
  key: CryptoKey,
): Promise<boolean> {
  try {
    const plain = await decryptNote(encoded, key);
    return plain === CANARY_PLAINTEXT;
  } catch {
    return false;
  }
}
