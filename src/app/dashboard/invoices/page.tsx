import Link from "next/link";
import { FilePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listInvoices } from "@/lib/invoices/queries";
import type { InvoiceRow } from "@/lib/invoices/shared";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSmartBillConfigured } from "@/lib/smartbill/client";
import { DashboardPage, PageHeader, SetupBanner, StatusBanner } from "@/components/app/page-shell";
import { InvoicesWorkspace } from "@/components/invoices/InvoicesWorkspace";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const configured = isSupabaseConfigured();
  const smartbillOk = isSmartBillConfigured();
  let invoices: InvoiceRow[] = [];
  let loadError: string | null = null;

  try {
    invoices = await listInvoices({ status });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Nu am putut încărca registrul de facturi în acest moment.";
  }
  const totalAmount = invoices
    .filter((i) => i.status === "PLĂTITĂ")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Facturi"
        description={`${invoices.length} facturi · ${totalAmount.toFixed(2)} RON încasat`}
        action={
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <FilePlus className="h-4 w-4" />
              Factură nouă
            </Link>
          </Button>
        }
      />

      {!configured && (
        <SetupBanner description="Registrul de facturi folosește acum doar date reale. Configurează Supabase pentru a vedea activitatea financiară." />
      )}

      {configured && loadError ? (
        <StatusBanner
          title="Facturile nu au putut fi încărcate"
          description={`Registrul financiar este disponibil, dar lista facturilor nu a putut fi citită acum. Reîncearcă în câteva secunde. Detaliu: ${loadError}`}
          tone="error"
        />
      ) : null}

      {configured && !smartbillOk && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          SmartBill neconfigurat — facturile se salvează local fără trimitere
          API. Setează <code>SMARTBILL_USERNAME</code>,{" "}
          <code>SMARTBILL_TOKEN</code>, <code>SMARTBILL_CIF</code>.
        </div>
      )}

      <InvoicesWorkspace
        key={`${status ?? "all"}:${invoices.length}:${loadError ?? "ok"}`}
        invoices={invoices}
        activeStatus={status}
        smartbillConfigured={smartbillOk}
        loadError={loadError}
      />
    </DashboardPage>
  );
}
