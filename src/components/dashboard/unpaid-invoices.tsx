import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UnpaidInvoice } from "@/lib/mock/dashboard";

export function UnpaidInvoices({ invoices }: { invoices: UnpaidInvoice[] }) {
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Facturi neachitate</CardTitle>
          <CardDescription>
            {invoices.length
              ? `${invoices.length} restante · ${total.toFixed(2)} RON`
              : "Toate facturile sunt achitate"}
          </CardDescription>
        </div>
        {invoices.length > 0 ? (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Niciun sold restant 🎉
          </p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.series}-{inv.number} · emisă{" "}
                  {format(inv.issuedAt, "d MMM", { locale: ro })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {inv.amount.toFixed(2)} RON
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    inv.daysOverdue >= 7 ? "text-rose-600" : "text-amber-600",
                  )}
                >
                  restantă de {inv.daysOverdue} zile
                </p>
              </div>
            </div>
          ))
        )}
        {invoices.length > 0 ? (
          <Button variant="outline" size="sm" className="w-full">
            Trimite reminder WhatsApp
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
