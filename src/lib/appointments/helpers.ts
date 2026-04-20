import type { Database } from "@/lib/supabase/types";

export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type AppointmentStatus =
  | "PROGRAMAT"
  | "CONFIRMAT"
  | "FINALIZAT"
  | "ANULAT"
  | "LIPSA";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "PROGRAMAT",
  "CONFIRMAT",
  "FINALIZAT",
  "ANULAT",
  "LIPSA",
];

export const statusLabel: Record<AppointmentStatus, string> = {
  PROGRAMAT: "Programat",
  CONFIRMAT: "Confirmat",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  LIPSA: "Lipsă",
};

export const statusVariant: Record<
  AppointmentStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  PROGRAMAT: "secondary",
  CONFIRMAT: "success",
  FINALIZAT: "default",
  ANULAT: "destructive",
  LIPSA: "warning",
};

export type LocationKind = "PRIVAT" | "POLICLINIC" | "ONLINE";

export const LOCATIONS: LocationKind[] = ["PRIVAT", "POLICLINIC", "ONLINE"];

export const locationLabel: Record<LocationKind, string> = {
  PRIVAT: "Cabinet privat",
  POLICLINIC: "Policlinică",
  ONLINE: "Online (Google Meet)",
};

/**
 * Location is derived, not stored separately: Google Meet link implies ONLINE,
 * the external-duty flag implies POLICLINIC, otherwise PRIVAT.
 */
export function deriveLocation(
  a: Pick<AppointmentRow, "meet_link" | "is_external_duty">,
): LocationKind {
  if (a.meet_link) return "ONLINE";
  if (a.is_external_duty) return "POLICLINIC";
  return "PRIVAT";
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
