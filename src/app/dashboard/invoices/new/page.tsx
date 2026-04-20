import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAppointments } from "@/lib/appointments/queries";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Înapoi la facturi
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Factură nouă
        </h1>
        <p className="text-sm text-muted-foreground">
          Emite o factură SmartBill · VAT 0% · serie{" "}
          {process.env.SMARTBILL_SERIES ?? "PSIH"}
        </p>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — factura nu va fi trimisă la SmartBill.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalii factură</CardTitle>
          <CardDescription>
            Selectează programarea finalizată și suma de facturat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            appointments={appointments}
            defaultAppointmentId={appointmentId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
