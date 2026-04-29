import { listCasAppointments } from "@/lib/appointments/queries";
import { CasModuleUI } from "@/components/cas/CasModuleUI";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";

export default async function CasModulePage() {
  const sessions = await listCasAppointments();

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Modul CAS"
        description="Evidența ședințelor decontate, documentația de trimitere și exporturile lunare pentru fluxul operațional CAS."
      />
      <CasModuleUI sessions={sessions} />
    </DashboardPage>
  );
}
