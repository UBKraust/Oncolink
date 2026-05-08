import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

import { getInvoice } from "@/lib/invoices/queries";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";
import { InvoiceDetailClient } from "@/components/invoices/InvoiceDetailClient";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const seriesNum = `${invoice.smartbill_series ?? "—"}/${invoice.smartbill_number ?? "—"}`;

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
        title={seriesNum}
        description={format(new Date(invoice.issued_at), "d MMMM yyyy", { locale: ro })}
      />
      <InvoiceDetailClient
        key={`${invoice.id}:${invoice.status}:${invoice.smartbill_id ?? "draft"}:${invoice.issued_at}`}
        invoice={invoice}
      />
    </DashboardPage>
  );
}
