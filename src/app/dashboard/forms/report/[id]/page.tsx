import { notFound } from "next/navigation";
import { listClients } from "@/lib/clients/queries";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { getTherapyReport } from "@/app/dashboard/forms/forms-actions";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";
import { ReportEditor } from "@/components/forms/ReportEditor";
import type { ReportContent } from "@/components/forms/ReportEditor";
import type { ReportType } from "@/app/dashboard/forms/forms-actions";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [report, clients, settings] = await Promise.all([
    getTherapyReport(id),
    listClients(),
    getTherapistSettings().catch(() => null),
  ]);

  if (!report) notFound();

  const activeClients = clients
    .filter((c) => !c.notes_anonymized_at)
    .map((c) => ({ id: c.id, full_name: c.full_name }));

  const psychologistName = settings?.full_name ?? settings?.practice_name ?? undefined;

  return (
    <DashboardPage className="max-w-4xl">
      <PageHeader
        title={report.title ?? "Raport psihologic"}
        description={`Nr. ${report.report_number ?? "—"} · ${report.status === "FINAL" ? "Finalizat" : "Ciornă"}`}
      />
      <ReportEditor
        clients={activeClients}
        reportId={report.id}
        initialContent={report.content as Partial<ReportContent>}
        initialClientId={report.client_id}
        initialReportType={report.report_type as ReportType}
        initialTitle={report.title ?? undefined}
        initialReportNumber={report.report_number ?? undefined}
        initialStatus={report.status}
        psychologistName={psychologistName}
      />
    </DashboardPage>
  );
}
