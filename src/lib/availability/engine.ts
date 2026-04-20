/**
 * Availability Engine.
 *
 * Rules:
 * 1. Working hours: Mon–Fri 08:00–20:00, Sat 09:00–14:00 (Europe/Bucharest)
 * 2. External duty blocks (is_external_duty=true) are hidden from public view
 *    but block time on the internal calendar.
 * 3. Travel buffer: 30 min before and after any POLICLINIC appointment.
 * 4. Slot granularity: 50-minute sessions with a 10-min break → 60-min slots.
 * 5. Only PROGRAMAT / CONFIRMAT appointments count as busy.
 */

import type { AppointmentRow } from "@/lib/appointments/helpers";
import { deriveLocation } from "@/lib/appointments/helpers";

const TZ = "Europe/Bucharest";
const SLOT_MINUTES = 60;
const SESSION_MINUTES = 50;
const TRAVEL_BUFFER_MINUTES = 30;

const WORKING_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,              // Sunday — closed
  1: { open: 8, close: 20 },
  2: { open: 8, close: 20 },
  3: { open: 8, close: 20 },
  4: { open: 8, close: 20 },
  5: { open: 8, close: 20 },
  6: { open: 9, close: 14 }, // Saturday
};

export interface AvailableSlot {
  start: Date;
  end: Date;
  /** ISO string for serialization */
  startISO: string;
  endISO: string;
}

interface BusyBlock {
  start: number; // ms
  end: number;   // ms
}

function toLocalDay(date: Date): { year: number; month: number; day: number; dow: number } {
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => local.find((p) => p.type === t)?.value ?? "";
  const dowMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    year: parseInt(get("year")),
    month: parseInt(get("month")),
    day: parseInt(get("day")),
    dow: dowMap[get("weekday")] ?? 0,
  };
}

function dayStart(year: number, month: number, day: number, hour: number): Date {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+02:00`);
}

function computeBusyBlocks(appointments: AppointmentRow[]): BusyBlock[] {
  const busy: BusyBlock[] = [];
  const active = appointments.filter(
    (a) =>
      a.status === "PROGRAMAT" ||
      a.status === "CONFIRMAT",
  );

  for (const a of active) {
    const start = new Date(a.appointment_date).getTime();
    const end = start + a.duration_minutes * 60_000;
    const loc = deriveLocation(a);

    if (loc === "POLICLINIC" || a.is_external_duty) {
      busy.push({
        start: start - TRAVEL_BUFFER_MINUTES * 60_000,
        end: end + TRAVEL_BUFFER_MINUTES * 60_000,
      });
    } else {
      busy.push({ start, end });
    }
  }
  return busy;
}

function isSlotFree(slotStart: number, slotEnd: number, busy: BusyBlock[]): boolean {
  for (const b of busy) {
    if (slotStart < b.end && slotEnd > b.start) return false;
  }
  return true;
}

/**
 * Returns available booking slots for the next `days` calendar days.
 */
export function getAvailableSlots(
  appointments: AppointmentRow[],
  days = 14,
): AvailableSlot[] {
  const busy = computeBusyBlocks(appointments);
  const slots: AvailableSlot[] = [];
  const now = Date.now();

  for (let d = 0; d < days; d++) {
    const cursor = new Date(now + d * 86_400_000);
    const { year, month, day, dow } = toLocalDay(cursor);
    const hours = WORKING_HOURS[dow];
    if (!hours) continue;

    let slotTime = dayStart(year, month, day, hours.open).getTime();
    const dayEnd = dayStart(year, month, day, hours.close).getTime();

    while (slotTime + SESSION_MINUTES * 60_000 <= dayEnd) {
      const slotEnd = slotTime + SESSION_MINUTES * 60_000;

      if (slotTime > now && isSlotFree(slotTime, slotEnd, busy)) {
        const start = new Date(slotTime);
        const end = new Date(slotEnd);
        slots.push({
          start,
          end,
          startISO: start.toISOString(),
          endISO: end.toISOString(),
        });
      }
      slotTime += SLOT_MINUTES * 60_000;
    }
  }
  return slots;
}
