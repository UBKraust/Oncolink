import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ClientsPage() {
  return (
    <ComingSoon
      title="Clienți"
      description="Gestionare fișă client: date personale, CNP/CIF, consimțământ GDPR, anonimizare."
      nextSteps={[
        "Listă clienți cu filtrare după status",
        "Formular creare / editare cu validare CNP",
        "Generare Contract + Consimțământ GDPR (PDF)",
        "„Forget Client”: anonimizare ireversibilă PII, istoricul facturilor rămâne",
      ]}
    />
  );
}
