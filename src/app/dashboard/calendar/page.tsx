import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendar"
      description="Vizualizare săptămânală + sincronizare bidirecțională cu Google Calendar."
      nextSteps={[
        "OAuth Google + stocare refresh token",
        "Availability Engine (privat vs policlinic, bufere travel)",
        "Webhook push + reconciliation job",
        "Extragere link Google Meet pentru sesiuni online",
      ]}
    />
  );
}
