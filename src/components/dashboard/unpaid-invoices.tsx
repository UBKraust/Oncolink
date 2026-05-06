import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertCircle, ArrowRight, MessageCircle, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnpaidInvoice } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function UnpaidInvoices({ invoices }: { invoices: UnpaidInvoice[] }) {
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);
  const urgentInvoices = invoices.filter((invoice) => invoice.daysOverdue >= 7).length;

  return (
    <SectionCard
      title="Facturi neachitate"
      description={
        invoices.length
          ? `${invoices.length} restante · ${total.toFixed(2)} RON de recuperat`
          : "Toate facturile sunt achitate"
      }
      icon={AlertCircle}
    >
      <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(248,250,252,0.45))] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Suma restantă
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
              {total.toFixed(2)} RON
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Totalul curent care încă trebuie recuperat</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-100">
                Urmărire
              </p>
              <Badge variant={urgentInvoices > 0 ? "warning" : "success"}>
                {urgentInvoices > 0 ? "urgent" : "stabil"}
              </Badge>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{urgentInvoices}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Facturi restante de minimum 7 zile</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 p-4">
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
              className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-foreground">{inv.clientName}</p>
                  <Badge variant="outline" className="px-2 py-1">
                    <ReceiptText className="mr-1 h-3 w-3" />
                    {inv.series}-{inv.number}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  Emisă {format(inv.issuedAt, "d MMM", { locale: ro })}
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
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-border/60 bg-card px-4 py-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/20">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              Trimite reminder WhatsApp
            </button>
            <Button asChild variant="outline" className="h-auto rounded-[1.5rem] px-4 py-3 text-xs font-bold">
              <Link href="/dashboard/invoices">
                Deschide registrul de facturi
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
