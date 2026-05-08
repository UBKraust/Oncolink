"use client";

import { useTransition } from "react";
import { Check, Loader2, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  cancelInvoice,
  markInvoicePaid,
  sendPreparedInvoiceToSmartBill,
} from "@/app/dashboard/invoices/actions";
import type { InvoiceRow } from "@/lib/invoices/shared";

interface InvoiceActionsProps {
  invoice: InvoiceRow;
  onUpdated?: (patch: Partial<InvoiceRow>) => void;
}

export function InvoiceActions({ invoice, onUpdated }: InvoiceActionsProps) {
  const [pending, startTransition] = useTransition();

  const canSendToSmartBill = invoice.status === "PREGĂTITĂ";
  const canMarkPaid = invoice.status === "EMISĂ" || invoice.status === "RESTANTĂ";
  const canCancel = invoice.status === "EMISĂ" || invoice.status === "RESTANTĂ";

  if (!canSendToSmartBill && !canMarkPaid && !canCancel) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      {canSendToSmartBill ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await sendPreparedInvoiceToSmartBill(invoice.id);
              if (!result.ok) {
                toast.error(result.error ?? "Nu am putut trimite factura în SmartBill.");
                return;
              }
              toast.success("Factura a fost trimisă în SmartBill.");
              onUpdated?.(result.invoice ?? { status: "EMISĂ" });
            })
          }
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Trimite în SmartBill
        </Button>
      ) : null}

      {canMarkPaid ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await markInvoicePaid(invoice.id);
              if (!result.ok) {
                toast.error(result.error ?? "Nu am putut actualiza factura.");
                return;
              }
              toast.success("Factura a fost marcată ca plătită.");
              onUpdated?.(result.invoice ?? { status: "PLĂTITĂ" });
            })
          }
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Marchează plătită
        </Button>
      ) : null}

      {canCancel ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelInvoice(invoice.id);
              if (!result.ok) {
                toast.error(result.error ?? "Nu am putut anula factura.");
                return;
              }
              toast.success("Factura a fost anulată.");
              onUpdated?.(result.invoice ?? { status: "ANULATĂ" });
            })
          }
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Anulează factură
        </Button>
      ) : null}
    </div>
  );
}
