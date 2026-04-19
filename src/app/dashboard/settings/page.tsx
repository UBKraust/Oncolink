import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Setări"
      description="Profil terapeut, tarif ședință, integrări Google / SmartBill / Twilio, setare PIN."
      nextSteps={[
        "Profil: nume, CIF, CPR code, IBAN",
        "Tarife per tip ședință + monedă",
        "Conectare Google Calendar + SmartBill + Twilio",
        "Schimbare PIN note clinice",
      ]}
    />
  );
}
