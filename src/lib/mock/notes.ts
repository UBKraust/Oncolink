import type { Database } from "@/lib/supabase/types";

export type MockNote = Database["public"]["Tables"]["notes"]["Row"];

const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

/**
 * Fake ciphertext for demo — real encrypted_content would be base64(iv||ct).
 * In demo mode the editor will show "poți nota aici" as a fresh start, since
 * the PIN on this machine would not decrypt these placeholders anyway.
 */
export const mockNotes: MockNote[] = [
  {
    id: "n-001",
    appointment_id: "ap-1001",
    encrypted_content: "ZGVtby1lbmNyeXB0ZWQtcGxhY2Vob2xkZXIK",
    therapist_id: null,
    created_at: iso(14),
    updated_at: iso(14),
  },
  {
    id: "n-002",
    appointment_id: "ap-1007",
    encrypted_content: "ZGVtby1lbmNyeXB0ZWQtcGxhY2Vob2xkZXIK",
    therapist_id: null,
    created_at: iso(7),
    updated_at: iso(6),
  },
];
