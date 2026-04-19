import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function DocumentsPage() {
  return (
    <ComingSoon
      title="Documente legale"
      description="Contract Prestări Servicii și Consimțământ GDPR, auto-populate din fișa clientului."
      nextSteps={[
        "Template PDF „Contract de Prestări Servicii” (CPR)",
        "Template PDF „Consimțământ GDPR”",
        "Stocare în Supabase Storage + link pe fișa clientului",
      ]}
    />
  );
}
