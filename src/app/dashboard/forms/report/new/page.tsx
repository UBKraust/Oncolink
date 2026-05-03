import { listClients } from "@/lib/clients/queries";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";
import { ReportEditor } from "@/components/forms/ReportEditor";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const [clients, settings] = await Promise.all([
    listClients(),
    getTherapistSettings().catch(() => null),
  ]);

  const activeClients = clients
    .filter((c) => !c.notes_anonymized_at)
    .map((c) => ({ id: c.id, full_name: c.full_name }));

  const psychologistName = settings?.full_name ?? settings?.practice_name ?? undefined;

  return (
    <DashboardPage className="max-w-4xl">
      <PageHeader
        title="Raport psihologic nou"
        description="Completează secțiunile raportului. Ciorna se salvează automat."
      />
      <ReportEditor
        clients={activeClients}
        initialClientId={clientId}
        psychologistName={psychologistName}
      />
    </DashboardPage>
  );
}
