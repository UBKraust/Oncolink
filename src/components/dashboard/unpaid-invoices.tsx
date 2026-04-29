import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnpaidInvoice } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";

export function UnpaidInvoices({ invoices }: { invoices: UnpaidInvoice[] }) {
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <SectionCard
      title="Facturi neachitate"
      description={
        invoices.length
          ? `${invoices.length} restante · ${total.toFixed(2)} RON`
          : "Toate facturile sunt achitate"
      }
      icon={AlertCircle}
    >
      <div className="space-y-2 p-4">
        {invoices.length === 0 ? (
          <EmptyState
            title="Niciun sold restant"
            description="Toate facturile sunt achitate în acest moment."
            icon={AlertCircle}
          />
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{inv.clientName}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  {inv.series}-{inv.number} · emisă {format(inv.issuedAt, "d MMM", { locale: ro })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-foreground tabular-nums">
                  {inv.amount.toFixed(2)} RON
                </p>
                <p className={cn(
                  "text-[11px] font-bold",
                  inv.daysOverdue >= 7 ? "text-rose-600" : "text-amber-600",
                )}>
                  restantă de {inv.daysOverdue} zile
                </p>
              </div>
            </div>
          ))
        )}

        {invoices.length > 0 && (
          <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/20">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            Trimite reminder WhatsApp
          </button>
        )}
      </div>
    </SectionCard>
  );
}
