import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ArrowLeft, CreditCard, ExternalLink, FileDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getInvoice, invoiceStatusVariant } from "@/lib/invoices/queries";
import { InvoiceActions } from "@/components/invoices/invoice-actions";

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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Înapoi la facturi
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight font-mono">
            {seriesNum}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(invoice.issued_at), "d MMMM yyyy", { locale: ro })}
          </p>
        </div>
        <Badge
          variant={
            invoiceStatusVariant[
              invoice.status as keyof typeof invoiceStatusVariant
            ] ?? "secondary"
          }
          className="self-start text-sm px-3 py-1"
        >
          {invoice.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalii factură</CardTitle>
          <CardDescription>e-Factura ANAF · TVA 0%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Client" value={invoice.client_name ?? "—"} />
          <Separator />
          <Row label="Serviciu" value="Ședință psihoterapie" />
          <Row label="U.M." value="ședință" />
          <Row label="Cantitate" value="1" />
          <Row
            label="Sumă"
            value={`${(invoice.amount ?? 0).toFixed(2)} RON`}
            bold
          />
          <Row label="TVA" value="Scutit (0%)" />
          <Separator />
          <Row label="Serie / Număr" value={seriesNum} mono />
          {invoice.smartbill_id ? (
            <Row label="SmartBill ID" value={invoice.smartbill_id} mono />
          ) : null}
          <Row
            label="Data emiterii"
            value={format(new Date(invoice.issued_at), "d MMM yyyy · HH:mm", {
              locale: ro,
            })}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {invoice.pdf_url ? (
          <Button asChild variant="outline" size="sm">
            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4" />
              Descarcă PDF
            </a>
          </Button>
        ) : null}

        {invoice.payment_link ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={invoice.payment_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CreditCard className="h-4 w-4" />
              Link plată
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        ) : null}

        {invoice.appointment_id ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/appointments/${invoice.appointment_id}`}>
              Deschide programarea
            </Link>
          </Button>
        ) : null}
      </div>

      <InvoiceActions invoice={invoice} />
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm ${bold ? "font-semibold" : ""} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
