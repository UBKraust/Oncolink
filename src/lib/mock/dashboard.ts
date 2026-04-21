/**
 * Mock data for the Dashboard UI. Replace with Supabase queries once the
 * calendar/billing modules are wired. Keep shapes aligned with the DB schema.
 */

import { clientStats } from "@/lib/mock/clients";
import { mockPayments } from "@/lib/mock/payments";

export type AppointmentStatus =
  | "PROGRAMAT"
  | "CONFIRMAT"
  | "FINALIZAT"
  | "ANULAT"
  | "LIPSA";

export type LocationKind = "PRIVAT" | "POLICLINIC" | "ONLINE";

export interface DashboardAppointment {
  id: string;
  clientName: string;
  clientInitials: string;
  startsAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  location: LocationKind;
  meetLink?: string;
  isExternalDuty?: boolean;
  price?: number;
}

export interface UnpaidInvoice {
  id: string;
  clientName: string;
  series: string;
  number: string;
  amount: number;
  issuedAt: Date;
  daysOverdue: number;
}

const now = new Date();
const hour = (h: number, m = 0) => {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
};
const dayOffset = (days: number, h: number, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
};

export const mockToday: DashboardAppointment[] = [
  {
    id: "a1",
    clientName: "Ana Popescu",
    clientInitials: "A.P.",
    startsAt: hour(9, 0),
    durationMinutes: 50,
    status: "CONFIRMAT",
    location: "PRIVAT",
    price: 200,
  },
  {
    id: "a2",
    clientName: "Mihai Ionescu",
    clientInitials: "M.I.",
    startsAt: hour(10, 30),
    durationMinutes: 50,
    status: "CONFIRMAT",
    location: "ONLINE",
    meetLink: "https://meet.google.com/abc-defg-hij",
    price: 300,
  },
  {
    id: "a3",
    clientName: "Gardă Policlinică",
    clientInitials: "—",
    startsAt: hour(13, 0),
    durationMinutes: 240,
    status: "PROGRAMAT",
    location: "POLICLINIC",
    isExternalDuty: true,
  },
  {
    id: "a4",
    clientName: "Elena Dumitrescu",
    clientInitials: "E.D.",
    startsAt: hour(17, 30),
    durationMinutes: 50,
    status: "PROGRAMAT",
    location: "PRIVAT",
    price: 250,
  },
];

export const mockUpcoming: DashboardAppointment[] = [
  {
    id: "u1",
    clientName: "Radu Stoica",
    clientInitials: "R.S.",
    startsAt: dayOffset(1, 11, 0),
    durationMinutes: 50,
    status: "PROGRAMAT",
    location: "PRIVAT",
  },
  {
    id: "u2",
    clientName: "Ioana Marin",
    clientInitials: "I.M.",
    startsAt: dayOffset(2, 15, 30),
    durationMinutes: 50,
    status: "CONFIRMAT",
    location: "ONLINE",
    meetLink: "https://meet.google.com/xyz-qrst-uvw",
  },
  {
    id: "u3",
    clientName: "Cristian Vasilescu",
    clientInitials: "C.V.",
    startsAt: dayOffset(3, 9, 0),
    durationMinutes: 50,
    status: "PROGRAMAT",
    location: "PRIVAT",
  },
  {
    id: "u4",
    clientName: "Diana Neagu",
    clientInitials: "D.N.",
    startsAt: dayOffset(4, 18, 0),
    durationMinutes: 50,
    status: "PROGRAMAT",
    location: "PRIVAT",
  },
];

export const mockUnpaidInvoices: UnpaidInvoice[] = [
  {
    id: "i1",
    clientName: "Mihai Ionescu",
    series: "ONC",
    number: "0042",
    amount: 250,
    issuedAt: dayOffset(-9, 10, 0),
    daysOverdue: 9,
  },
  {
    id: "i2",
    clientName: "Ioana Marin",
    series: "ONC",
    number: "0047",
    amount: 250,
    issuedAt: dayOffset(-3, 10, 0),
    daysOverdue: 3,
  },
];

export interface DashboardStats {
  appointmentsToday: number;
  activeClients: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  revenueMonth: number;
  totalSessions: number;
  totalHours: number;
  totalRevenue: number;
  totalPatients: number;
  privatePatients: number;
  clinicPatients: number;
  minorPatients: number;
  adultPatients: number;
  b2bPatients: number;
  expensesMonth: number;
  netProfitMonth: number;
  vaultAlertsCount: number;
  vaultTotalDocs: number;
}

// Compute current month stats dynamically for demo consistency
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();
const monthStart = new Date(currentYear, currentMonth - 1, 1);
const monthEnd = new Date(currentYear, currentMonth, 1);

const monthPayments = mockPayments.filter(p => {
  const d = new Date(p.appointment_date);
  return d >= monthStart && d < monthEnd;
});

const monthRevenue = monthPayments.filter(p => p.invoice_status === "ACHITATĂ").reduce((s, p) => s + p.amount, 0);
const monthTotalFacturat = monthPayments.reduce((s, p) => s + p.amount, 0);
const monthTotalHours = Math.round(monthPayments.reduce((s, p) => s + p.duration_minutes, 0) / 60 * 10) / 10;
const monthExpenses = 2100 + (currentMonth % 3) * 400 + (currentMonth % 2 === 0 ? 150 : 0);

export const mockStats: DashboardStats = {
  appointmentsToday: mockToday.filter((a) => !a.isExternalDuty).length,
  activeClients: clientStats.total,
  unpaidInvoicesCount: mockUnpaidInvoices.length,
  unpaidInvoicesTotal: mockUnpaidInvoices.reduce((sum, i) => sum + i.amount, 0),
  revenueMonth: monthTotalFacturat,
  totalSessions: monthPayments.length,
  totalHours: monthTotalHours,
  totalRevenue: monthTotalFacturat,
  totalPatients:   clientStats.total,
  privatePatients: clientStats.cabinet,
  clinicPatients:  clientStats.clinica,
  minorPatients:   clientStats.minori,
  adultPatients:   clientStats.adulti,
  b2bPatients:     clientStats.b2b,
  expensesMonth:   monthExpenses,
  netProfitMonth:  monthRevenue - monthExpenses,
  vaultAlertsCount: 2,
  vaultTotalDocs:   12,
};
