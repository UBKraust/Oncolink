import { listCasAppointments } from "@/lib/appointments/queries";
import { CasModuleUI } from "@/components/cas/CasModuleUI";

export default async function CasModulePage() {
  const sessions = await listCasAppointments();

  return <CasModuleUI sessions={sessions} />;
}
