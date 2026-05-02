import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, differenceInDays, addDays } from "date-fns";
import { initialsFromName } from "@/lib/clients/validation";
import { deriveLocation, type AppointmentStatus, type LocationKind } from "@/lib/appointments/helpers";
import { isPaidInvoiceStatus, normalizeInvoiceStatus } from "@/lib/invoices/status";

type InvoiceWithAppointmentClient = {
  id: string;
  smartbill_series: string | null;
  smartbill_number: string | null;
  amount: number | null;
  issued_at: string;
  status: string;
  appointments:
    | { clients: { full_name: string | null } | { full_name: string | null }[] | null }
    | { clients: { full_name: string | null } | { full_name: string | null }[] | null }[]
    | null;
};

type AppointmentWithClient = {
  id: string;
  appointment_date: string;
  duration_minutes: number | null;
  status: string | null;
  is_external_duty: boolean | null;
  location_tag: string | null;
  meet_link: string | null;
  clients:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

export interface DashboardStats {
  totalRevenue: number;
  expensesMonth: number;
  netProfitMonth: number;
  appointmentsToday: number;
  totalHours: number;
  pendingMinorReviews: number;
  privatePatients: number;
  clinicPatients: number;
  minorPatients: number;
  adultPatients: number;
  b2bPatients: number;
  vaultAlertsCount: number;
  vaultTotalDocs: number;
}

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalRevenue: 0,
  expensesMonth: 0,
  netProfitMonth: 0,
  appointmentsToday: 0,
  totalHours: 0,
  pendingMinorReviews: 0,
  privatePatients: 0,
  clinicPatients: 0,
  minorPatients: 0,
  adultPatients: 0,
  b2bPatients: 0,
  vaultAlertsCount: 0,
  vaultTotalDocs: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return EMPTY_DASHBOARD_STATS;
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const startMonth = startOfMonth(now).toISOString();
  const endMonth = endOfMonth(now).toISOString();
  const startToday = startOfDay(now).toISOString();
  const endToday = endOfDay(now).toISOString();

  // 1. Total Revenue (Invoiced this month)
  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount")
    .gte("issued_at", startMonth)
    .lte("issued_at", endMonth);
  const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

  // 2. Expenses (this month)
  const { data: expenses } = await supabase
    .from("cabinet_expenses")
    .select("amount")
    .gte("expense_date", startMonth)
    .lte("expense_date", endMonth);
  const expensesMonth = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

  // 3. Appointments Today
  const { count: appointmentsToday } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .gte("appointment_date", startToday)
    .lte("appointment_date", endToday);

  // 4. Total Hours (completed this month - assuming 50min sessions as ~0.83h)
  const { data: monthlyApps } = await supabase
    .from("appointments")
    .select("duration_minutes")
    .gte("appointment_date", startMonth)
    .lte("appointment_date", endMonth)
    .eq("status", "FINALIZAT");
  const totalMinutes = monthlyApps?.reduce((sum, app) => sum + (app.duration_minutes || 50), 0) || 0;
  const totalHours = Math.round(totalMinutes / 60);

  // 5. Pending Minor Reviews
  const { count: pendingMinorReviews, error: minorError } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("is_minor", true)
    .eq("needs_legal_review", true);

  if (minorError) console.error("Error fetching pending minor reviews:", minorError);

  // 6. Demographics
  const { data: clients, error: demographicsError } = await supabase
    .from("clients")
    .select("is_minor, billing_type, company_name, location");
  
  if (demographicsError) console.error("Error fetching demographics:", demographicsError);
  
  const minorPatients = clients?.filter(c => c.is_minor).length || 0;
  const adultPatients = (clients?.length || 0) - minorPatients;
  const b2bPatients = clients?.filter(c => c.billing_type === "B2B_COMPANY" || c.company_name).length || 0;
  const privatePatients = clients?.filter(c => c.location === "CABINET_PARTICULAR").length || 0;
  const clinicPatients = clients?.filter(c => c.location === "CLINICA").length || 0;

  // 7. Vault Stats — therapist_documents (profesional vault, nu patient_documents)
  const { count: vaultTotalDocs } = await supabase
    .from("therapist_documents")
    .select("*", { count: "exact", head: true })
    .then((r) => (r.error ? { count: 0 } : r));

  const vaultAlertDeadline = endOfDay(addDays(now, 30)).toISOString();
  const { count: vaultAlertsCount } = await supabase
    .from("therapist_documents")
    .select("*", { count: "exact", head: true })
    .not("expiry_date", "is", null)
    .lte("expiry_date", vaultAlertDeadline)
    .then((r) => (r.error ? { count: 0 } : r));

  return {
    totalRevenue,
    expensesMonth,
    netProfitMonth: totalRevenue - expensesMonth,
    appointmentsToday: appointmentsToday || 0,
    totalHours,
    pendingMinorReviews: pendingMinorReviews || 0,
    privatePatients,
    clinicPatients,
    minorPatients,
    adultPatients,
    b2bPatients,
    vaultAlertsCount: vaultAlertsCount || 0,
    vaultTotalDocs: vaultTotalDocs || 0,
  };
}

export async function getUnpaidInvoices() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, appointments(clients(full_name))")
    .order("issued_at", { ascending: false })
    .limit(20);
  
  const now = new Date();
  
  return (
    (data as InvoiceWithAppointmentClient[] | null)
      ?.filter((invoice) => {
        const normalizedStatus = normalizeInvoiceStatus(invoice.status);
        return normalizedStatus !== "ANULATĂ" && !isPaidInvoiceStatus(normalizedStatus);
      })
      .slice(0, 5)
      .map((invoice) => {
        const appointmentRelation = Array.isArray(invoice.appointments)
          ? invoice.appointments[0]
          : invoice.appointments;
        const clientRelation = Array.isArray(appointmentRelation?.clients)
          ? appointmentRelation.clients[0]
          : appointmentRelation?.clients;

        return {
          id: invoice.id,
          clientName: clientRelation?.full_name || "Client Necunoscut",
          series: invoice.smartbill_series || "FĂRĂ",
          number: invoice.smartbill_number || "0000",
          amount: Number(invoice.amount ?? 0),
          issuedAt: new Date(invoice.issued_at),
          daysOverdue: differenceInDays(now, new Date(invoice.issued_at)),
          status: invoice.status,
        };
      }) || []
  );
}

export async function getAppointmentsToday() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const { data } = await supabase
    .from("appointments")
    .select("*, clients(full_name)")
    .gte("appointment_date", startOfDay(now).toISOString())
    .lte("appointment_date", endOfDay(now).toISOString())
    .order("appointment_date", { ascending: true });

  return (
    (data as AppointmentWithClient[] | null)?.map((appointment) => {
      const clientRelation = Array.isArray(appointment.clients)
        ? appointment.clients[0]
        : appointment.clients;
      const clientName = clientRelation?.full_name || "Client";

      return {
        id: appointment.id,
        clientName,
        clientInitials: initialsFromName(clientName),
        startsAt: new Date(appointment.appointment_date),
        durationMinutes: appointment.duration_minutes || 50,
        status: (appointment.status || "PROGRAMAT") as AppointmentStatus,
        location: deriveLocation({
          meet_link: appointment.meet_link,
          is_external_duty: appointment.is_external_duty || false,
          location_tag: appointment.location_tag,
        }) as LocationKind,
        isExternalDuty: appointment.is_external_duty || false,
        meetLink: appointment.meet_link || undefined,
      };
    }) || []
  );
}

export async function getUpcomingAppointments() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data } = await supabase
    .from("appointments")
    .select("*, clients(full_name)")
    .gte("appointment_date", startOfDay(tomorrow).toISOString())
    .order("appointment_date", { ascending: true })
    .limit(10);

  return (
    (data as AppointmentWithClient[] | null)?.map((appointment) => {
      const clientRelation = Array.isArray(appointment.clients)
        ? appointment.clients[0]
        : appointment.clients;
      const clientName = clientRelation?.full_name || "Client";

      return {
        id: appointment.id,
        clientName,
        clientInitials: initialsFromName(clientName),
        startsAt: new Date(appointment.appointment_date),
        durationMinutes: appointment.duration_minutes || 50,
        status: (appointment.status || "PROGRAMAT") as AppointmentStatus,
        location: deriveLocation({
          meet_link: appointment.meet_link,
          is_external_duty: appointment.is_external_duty || false,
          location_tag: appointment.location_tag,
        }) as LocationKind,
        isExternalDuty: appointment.is_external_duty || false,
        meetLink: appointment.meet_link || undefined,
      };
    }) || []
  );
}
