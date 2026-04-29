import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  CardContent,
} from "@/components/ui/card";
import { listAppointments } from "@/lib/appointments/queries";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { appointmentId } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({
    status: "FINALIZAT",
  });

  return (
    <DashboardPage className="max-w-2xl">
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Înapoi la facturi
      </Link>

      <PageHeader
        title="Factură nouă"
        description={`Emite o factură SmartBill · VAT 0% · serie ${process.env.SMARTBILL_SERIES ?? "PSIH"}`}
      />

      {!configured && (
        <SetupBanner description="Factura poate fi pregătită vizual, dar emiterea reală necesită Supabase și integrarea SmartBill configurate." />
      )}

      <SectionCard
        title="Detalii factură"
        description="Selectează programarea finalizată și suma de facturat."
      >
        <CardContent>
          <InvoiceForm
            appointments={appointments}
            defaultAppointmentId={appointmentId}
          />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
