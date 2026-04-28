import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnpaidInvoice } from "@/lib/mock/dashboard";

export function UnpaidInvoices({ invoices }: { invoices: UnpaidInvoice[] }) {
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div>
          <h3 className="text-sm font-black text-slate-800">Facturi neachitate</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {invoices.length
              ? `${invoices.length} restante · ${total.toFixed(2)} RON`
              : "Toate facturile sunt achitate"}
          </p>
        </div>
        {invoices.length > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Niciun sold restant 🎉</p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{inv.clientName}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {inv.series}-{inv.number} · emisă {format(inv.issuedAt, "d MMM", { locale: ro })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-800 tabular-nums">
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
          <button className="mt-1 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            Trimite reminder WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
