"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelInvoice, markInvoicePaid } from "@/app/dashboard/invoices/actions";
import type { InvoiceRow } from "@/lib/invoices/queries";

interface InvoiceActionsProps {
  invoice: InvoiceRow;
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const canMarkPaid = invoice.status === "EMISĂ" || invoice.status === "RESTANTĂ";
  const canCancel = invoice.status === "EMISĂ" || invoice.status === "RESTANTĂ";

  if (!canMarkPaid && !canCancel) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      {canMarkPaid ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markInvoicePaid(invoice.id);
              router.refresh();
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
              await cancelInvoice(invoice.id);
              router.refresh();
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
