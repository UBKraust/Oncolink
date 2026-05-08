import { isPaidInvoiceStatus } from "@/lib/invoices/status";

export type MonthlySummaryAppointmentRow = {
  id: string;
  client_id: string;
  appointment_date: string;
  duration_minutes: number;
  clients: { full_name: string | null }[] | { full_name: string | null } | null;
};

export type MonthlySummaryInvoiceRow = {
  appointment_id: string | null;
  amount: number | null;
  status: string | null;
};

export interface MonthlyBillingClientRow {
  clientId: string;
  clientName: string;
  sessions: number;
  totalMinutes: number;
  totalAmount: number;
  collectedAmount: number;
  invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS" | "PREGĂTITĂ";
}

export interface MonthlyBillingAppointmentExportRow {
  appointmentId: string;
  clientId: string;
  clientName: string;
  appointmentDate: string;
  durationMinutes: number;
  totalAmount: number;
  collectedAmount: number;
  invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS" | "PREGĂTITĂ";
}

export interface MonthlyBillingSummary {
  year: number;
  month: number;
  totalSessions: number;
  totalHours: number;
  totalAmount: number;
  collectedAmount: number;
  uncollectedAmount: number;
  invoiceCandidatesCount: number;
  preparedInvoicesCount: number;
  clients: MonthlyBillingClientRow[];
  appointments: MonthlyBillingAppointmentExportRow[];
}

export function buildMonthlyBillingSummary(
  appts: MonthlySummaryAppointmentRow[],
  invoices: MonthlySummaryInvoiceRow[],
  year: number,
  month: number,
): MonthlyBillingSummary {
  const invoiceMap = new Map<string, MonthlySummaryInvoiceRow[]>();
  for (const invoice of invoices) {
    if (!invoice.appointment_id) continue;
    const existing = invoiceMap.get(invoice.appointment_id) ?? [];
    existing.push(invoice);
    invoiceMap.set(invoice.appointment_id, existing);
  }

  const perClient: Record<string, MonthlyBillingClientRow> = {};
  const appointments: MonthlyBillingAppointmentExportRow[] = [];

  for (const appointment of appts) {
    const clientRelation = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;
    const clientName = clientRelation?.full_name ?? "Client necunoscut";

    if (!perClient[appointment.client_id]) {
      perClient[appointment.client_id] = {
        clientId: appointment.client_id,
        clientName,
        sessions: 0,
        totalMinutes: 0,
        totalAmount: 0,
        collectedAmount: 0,
        invoiceStatus: "NEEMIS",
      };
    }

    const row = perClient[appointment.client_id];
    const appointmentInvoices = invoiceMap.get(appointment.id) ?? [];
    const appointmentTotal = appointmentInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount ?? 0),
      0,
    );
    const appointmentCollected = appointmentInvoices.reduce(
      (sum, invoice) =>
        sum + (isPaidInvoiceStatus(invoice.status) ? Number(invoice.amount ?? 0) : 0),
      0,
    );
    const hasPreparedInvoice = appointmentInvoices.some(
      (invoice) => invoice.status === "PREGĂTITĂ",
    );
    const appointmentInvoiceStatus =
      appointmentCollected >= appointmentTotal && appointmentTotal > 0
        ? "ACHITAT"
        : hasPreparedInvoice
          ? "PREGĂTITĂ"
          : appointmentCollected > 0
            ? "PARTIAL"
            : "NEEMIS";

    row.sessions += 1;
    row.totalMinutes += appointment.duration_minutes;
    row.totalAmount += appointmentTotal;
    row.collectedAmount += appointmentCollected;

    appointments.push({
      appointmentId: appointment.id,
      clientId: appointment.client_id,
      clientName,
      appointmentDate: appointment.appointment_date,
      durationMinutes: appointment.duration_minutes,
      totalAmount: appointmentTotal,
      collectedAmount: appointmentCollected,
      invoiceStatus: appointmentInvoiceStatus,
    });
  }

  for (const row of Object.values(perClient)) {
    const clientPreparedCount = appointments.filter(
      (appointment) =>
        appointment.clientId === row.clientId && appointment.invoiceStatus === "PREGĂTITĂ",
    ).length;

    if (row.collectedAmount >= row.totalAmount && row.totalAmount > 0) {
      row.invoiceStatus = "ACHITAT";
    } else if (clientPreparedCount > 0) {
      row.invoiceStatus = "PREGĂTITĂ";
    } else if (row.collectedAmount > 0) {
      row.invoiceStatus = "PARTIAL";
    } else {
      row.invoiceStatus = "NEEMIS";
    }
  }

  const clients = Object.values(perClient).sort((a, b) =>
    a.clientName.localeCompare(b.clientName, "ro"),
  );

  return {
    year,
    month,
    totalSessions: clients.reduce((sum, client) => sum + client.sessions, 0),
    totalHours:
      Math.round((clients.reduce((sum, client) => sum + client.totalMinutes, 0) / 60) * 10) / 10,
    totalAmount: clients.reduce((sum, client) => sum + client.totalAmount, 0),
    collectedAmount: clients.reduce((sum, client) => sum + client.collectedAmount, 0),
    uncollectedAmount: clients.reduce(
      (sum, client) => sum + (client.totalAmount - client.collectedAmount),
      0,
    ),
    invoiceCandidatesCount: appointments.filter(
      (appointment) => appointment.invoiceStatus === "NEEMIS",
    ).length,
    preparedInvoicesCount: appointments.filter(
      (appointment) => appointment.invoiceStatus === "PREGĂTITĂ",
    ).length,
    clients,
    appointments: appointments.toSorted(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    ),
  };
}
