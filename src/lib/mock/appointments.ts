import type { Database } from "@/lib/supabase/types";

export type MockAppointment = Database["public"]["Tables"]["appointments"]["Row"];

/**
 * Utility to generate a specific date for the week of April 20, 2026.
 */
const dateAt = (dayIndex: number, h: number, m = 0) => {
  // 2026-04-20 is a Monday
  const d = new Date("2026-04-20T00:00:00Z");
  d.setDate(d.getDate() + dayIndex);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const clients = ["c-001", "c-002", "c-003", "c-004", "c-005"];

const generateDay = (
  dayIndex: number,
  start: number,
  end: number,
  options: { tag?: string | null; is_external?: boolean; online?: boolean } = {}
): MockAppointment[] => {
  const result: MockAppointment[] = [];
  for (let h = start; h < end; h++) {
    const id = `sim-${dayIndex}-${h}`;
    const clientId = clients[(dayIndex + h) % clients.length];
    result.push({
      id,
      client_id: clientId,
      appointment_date: dateAt(dayIndex, h),
      duration_minutes: 50,
      status: "PROGRAMAT",
      google_event_id: null,
      meet_link: options.online ? "https://meet.google.com/abc-def-ghi" : null,
      payment_link: null,
      is_external_duty: options.is_external || false,
      location_tag: options.tag || null,
      personal_notes: "Simulare program full.",
      reminders_enabled: true,
      reminder_minutes: 60,
      created_at: new Date().toISOString(),
    } as any);
  }
  return result;
};

export const mockAppointments: MockAppointment[] = [
  // Luni: Clinica 10:00 - 20:00
  ...generateDay(0, 10, 20, { tag: "#Clinica", is_external: true }),
  
  // Marti: Mix (Online, Clinica, Cabinet) 9:00 - 21:00
  ...generateDay(1, 9, 13, { tag: "#cabinet" }),
  ...generateDay(1, 13, 17, { tag: "#Clinica", is_external: true }),
  ...generateDay(1, 17, 21, { tag: null, online: true }),
  
  // Miercuri: Clinica 9:00 - 20:00
  ...generateDay(2, 9, 20, { tag: "#Clinica", is_external: true }),
  
  // Joi: Cabinet 9:00 - 21:00
  ...generateDay(3, 9, 21, { tag: "#cabinet", is_external: false }),
  
  // Vineri: Cabinet 9:00 - 21:00
  ...generateDay(4, 9, 21, { tag: "#cabinet", is_external: false }),
  
  // Sambata: 10:00 - 15:00
  ...generateDay(5, 10, 15, { tag: "#cabinet" }),
];
