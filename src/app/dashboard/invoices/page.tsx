import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function InvoicesPage() {
  return (
    <ComingSoon
      title="Facturi"
      description="Emitere automată e-Factura prin SmartBill (VAT 0%, unit „ședință”)."
      nextSteps={[
        "Integrare API SmartBill + stocare serie/număr",
        "Generare payment link card (fără casă de marcat)",
        "Webhook SmartBill → marcare PLĂTITĂ",
        "Reminder WhatsApp la facturi restante",
      ]}
    />
  );
}
