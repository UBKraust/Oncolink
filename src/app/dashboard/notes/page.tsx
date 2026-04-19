import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function NotesPage() {
  return (
    <ComingSoon
      title="Note clinice"
      description="Note criptate end-to-end, deblocate local cu PIN-ul terapeutului."
      nextSteps={[
        "Criptare client-side (WebCrypto PBKDF2 + AES-GCM) înainte de DB",
        "UI PIN unlock + auto-lock după inactivitate",
        "Import note de pe reMarkable (Google Drive folder / email parser)",
        "AI local via Ollama: Progres Raport, format SOAP, Extrage Teme",
      ]}
    />
  );
}
