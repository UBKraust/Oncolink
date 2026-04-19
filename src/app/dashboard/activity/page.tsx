import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ActivityPage() {
  return (
    <ComingSoon
      title="Registru activitate"
      description="Export pentru CPR: dată, inițiale client, tip serviciu (fără PII)."
      nextSteps={[
        "Populare activity_logs la fiecare sesiune finalizată",
        "Export CSV și XLSX cu filtru pe perioadă",
        "Semnătură terapeut pe raport",
      ]}
    />
  );
}
