/**
 * Dual overlap check: Supabase DB + Google Calendar FreeBusy.
 *
 * Call checkOverlap() BEFORE inserting an appointment.
 * It throws OverlapError if the slot is taken by either source.
 *
 * Race-condition safety: the DB insert in the API route relies on a
 * unique partial index (no_overlap_idx) created in migration 0014.
 * If two concurrent requests pass the check simultaneously, the DB
 * constraint will reject the second insert with a unique-violation,
 * which the route maps to a 409.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFreeBusy } from "@/lib/google/client";
import { getValidAccessToken } from "@/lib/google/sync";

export class OverlapError extends Error {
  constructor(public source: "supabase" | "google", message: string) {
    super(message);
    this.name = "OverlapError";
  }
}

/**
 * Checks whether the time window [startISO, startISO + durationMinutes)
 * overlaps with any existing non-cancelled appointment in Supabase,
 * and/or any busy period reported by Google Calendar FreeBusy API.
 *
 * @throws OverlapError if a conflict is detected
 */
export async function checkOverlap(
  startISO: string,
  durationMinutes: number,
): Promise<void> {
  const startMs = new Date(startISO).getTime();
  const endMs = startMs + durationMinutes * 60_000;
  const startUTC = new Date(startMs).toISOString();
  const endUTC = new Date(endMs).toISOString();

  // --- 1. Supabase overlap check ---
  // An existing appointment [A_start, A_end) overlaps [start, end) when:
  //   A_start < end  AND  A_start + duration > start
  // We approximate by checking: A_start < end AND A_start >= start - maxDuration
  // Then filter precisely in JS to handle variable durations.
  const supabase = await createSupabaseServerClient();
  const { data: candidates, error } = await supabase
    .from("appointments")
    .select("appointment_date, duration_minutes")
    .lt("appointment_date", endUTC)
    .gte(
      "appointment_date",
      new Date(startMs - 4 * 60 * 60_000).toISOString(), // look back up to 4 h
    )
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  if (error) throw new Error(`Supabase check failed: ${error.message}`);

  for (const row of candidates ?? []) {
    const aStart = new Date(row.appointment_date).getTime();
    const aEnd = aStart + (row.duration_minutes ?? 50) * 60_000;
    // Overlap: intervals intersect if aStart < endMs AND aEnd > startMs
    if (aStart < endMs && aEnd > startMs) {
      throw new OverlapError(
        "supabase",
        "Intervalul se suprapune cu o programare existentă.",
      );
    }
  }

  // --- 2. Google Calendar FreeBusy check ---
  const accessToken = await getValidAccessToken().catch(() => null);
  if (accessToken) {
    const busy = await getFreeBusy(
      accessToken,
      "primary",
      startUTC,
      endUTC,
    ).catch(() => []); // non-fatal — if Google is down, don't block booking

    if (busy.length > 0) {
      throw new OverlapError(
        "google",
        "Terapeutul are un eveniment în Google Calendar în acest interval.",
      );
    }
  }
}
