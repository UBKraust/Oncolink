import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { initialsFromName } from "@/lib/clients/validation";
import { LocationKind } from "@/lib/mock/dashboard";

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

export async function getDashboardStats(): Promise<DashboardStats> {
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
    .gte("date", startMonth)
    .lte("date", endMonth);
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
    .select("is_minor, billing_type, company_name");
  
  if (demographicsError) console.error("Error fetching demographics:", demographicsError);
  
  const minorPatients = clients?.filter(c => c.is_minor).length || 0;
  const adultPatients = (clients?.length || 0) - minorPatients;
  const b2bPatients = clients?.filter(c => c.billing_type === "COMPANY" || c.company_name).length || 0;

  // 7. Vault Stats
  const { count: vaultTotalDocs } = await supabase
    .from("patient_documents")
    .select("*", { count: "exact", head: true });

  return {
    totalRevenue,
    expensesMonth,
    netProfitMonth: totalRevenue - expensesMonth,
    appointmentsToday: appointmentsToday || 0,
    totalHours,
    pendingMinorReviews: pendingMinorReviews || 0,
    privatePatients: clients?.filter(c => c.billing_type !== "COMPANY").length || 0,
    clinicPatients: 0, // We don't have cabinet_id column yet
    minorPatients,
    adultPatients,
    b2bPatients,
    vaultAlertsCount: 0, 
    vaultTotalDocs: vaultTotalDocs || 0,
  };
}

export async function getUnpaidInvoices() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, appointments(clients(full_name))")
    .neq("status", "PLĂTITĂ")
    .order("issued_at", { ascending: false })
    .limit(5);
  
  const now = new Date();
  
  return data?.map(inv => ({
    id: inv.id,
    clientName: (inv.appointments as any)?.clients?.full_name || "Client Necunoscut",
    series: inv.smartbill_series || "FĂRĂ",
    number: inv.smartbill_number || "0000",
    amount: Number(inv.amount),
    issuedAt: new Date(inv.issued_at),
    daysOverdue: differenceInDays(now, new Date(inv.issued_at)),
    status: inv.status
  })) || [];
}

export async function getAppointmentsToday() {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const { data } = await supabase
    .from("appointments")
    .select("*, clients(full_name)")
    .gte("appointment_date", startOfDay(now).toISOString())
    .lte("appointment_date", endOfDay(now).toISOString())
    .order("appointment_date", { ascending: true });

  return data?.map(app => {
    const clientName = (app.clients as any)?.full_name || "Client";
    return {
      id: app.id,
      clientName,
      clientInitials: initialsFromName(clientName),
      startsAt: new Date(app.appointment_date),
      durationMinutes: app.duration_minutes || 50,
      status: app.status as any,
      location: (app.is_external_duty ? "POLICLINIC" : (app.location_tag === "#Clinica" ? "CLINICA" : "CABINET")) as LocationKind,
      isExternalDuty: app.is_external_duty,
      meetLink: app.meet_link
    };
  }) || [];
}

export async function getUpcomingAppointments() {
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

  return data?.map(app => {
    const clientName = (app.clients as any)?.full_name || "Client";
    return {
      id: app.id,
      clientName,
      clientInitials: initialsFromName(clientName),
      startsAt: new Date(app.appointment_date),
      durationMinutes: app.duration_minutes || 50,
      status: app.status as any,
      location: (app.is_external_duty ? "POLICLINIC" : (app.location_tag === "#Clinica" ? "CLINICA" : "CABINET")) as LocationKind,
      isExternalDuty: app.is_external_duty,
      meetLink: app.meet_link
    };
  }) || [];
}
