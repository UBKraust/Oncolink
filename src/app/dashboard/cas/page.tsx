import { listCasAppointments } from "@/lib/appointments/queries";
import { CasModuleUI } from "@/components/cas/CasModuleUI";
import { DashboardPage } from "@/components/app/page-shell";

export default async function CasModulePage() {
  const sessions = await listCasAppointments();

  return (
    <DashboardPage className="max-w-6xl">
      <CasModuleUI sessions={sessions} />
    </DashboardPage>
  );
}
