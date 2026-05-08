"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CreditCard, ExternalLink, FileDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CardContent } from "@/components/ui/card";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { SectionCard } from "@/components/app/page-shell";
import { invoiceStatusVariant, type InvoiceRow } from "@/lib/invoices/shared";

interface InvoiceDetailClientProps {
  invoice: InvoiceRow;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const [invoiceState, setInvoiceState] = useState(invoice);

  const seriesNum = useMemo(
    () => `${invoiceState.smartbill_series ?? "—"}/${invoiceState.smartbill_number ?? "—"}`,
    [invoiceState.smartbill_number, invoiceState.smartbill_series],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {invoiceState.pdf_url ? (
          <Button asChild variant="outline" size="sm">
            <a href={invoiceState.pdf_url} target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4" />
              Descarcă PDF
            </a>
          </Button>
        ) : null}

        {invoiceState.payment_link ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={invoiceState.payment_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CreditCard className="h-4 w-4" />
              Link plată
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        ) : null}

        {invoiceState.appointment_id ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/appointments/${invoiceState.appointment_id}`}>
              Deschide programarea
            </Link>
          </Button>
        ) : null}
      </div>

      <SectionCard
        title="Detalii factură"
        description="e-Factura ANAF · TVA 0%"
        icon={FileDown}
      >
        <CardContent className="space-y-4">
          <Row label="Client" value={invoiceState.client_name ?? "—"} />
          <Separator />
          <Row label="Serviciu" value="Ședință psihoterapie" />
          <Row label="U.M." value="ședință" />
          <Row label="Cantitate" value="1" />
          <Row
            label="Sumă"
            value={`${(invoiceState.amount ?? 0).toFixed(2)} RON`}
            bold
          />
          <Row label="TVA" value="Scutit (0%)" />
          <Separator />
          <Row label="Serie / Număr" value={seriesNum} mono />
          {invoiceState.smartbill_id ? (
            <Row label="SmartBill ID" value={invoiceState.smartbill_id} mono />
          ) : null}
          <Row
            label="Data emiterii"
            value={format(new Date(invoiceState.issued_at), "d MMM yyyy · HH:mm", {
              locale: ro,
            })}
          />
        </CardContent>
      </SectionCard>

      <div className="flex items-start justify-between gap-4">
        <Badge
          variant={
            invoiceStatusVariant[
              invoiceState.status as keyof typeof invoiceStatusVariant
            ] ?? "secondary"
          }
          className="self-start px-3 py-1 text-sm"
        >
          {invoiceState.status}
        </Badge>
      </div>

      <InvoiceActions
        invoice={invoiceState}
        onUpdated={(patch) =>
          setInvoiceState((prev) => ({
            ...prev,
            ...patch,
          }))
        }
      />
    </>
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
