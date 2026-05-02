"use client";

import React from "react";
import { Wallet, TrendingUp, Receipt, CalendarClock } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ClientPayment } from "./types";
import { isPaidInvoiceStatus } from "@/lib/invoices/status";

interface FinancialDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  payments: ClientPayment[];
  clientName: string;
}

export function FinancialDetailOverlay({ isOpen, onClose, payments, clientName }: FinancialDetailOverlayProps) {
  const totalPaid = payments
    .filter((payment) => isPaidInvoiceStatus(payment.status))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalPending = payments
    .filter((payment) => payment.status === "EMISĂ")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Istoric Financiar"
      subtitle={`Situație plătitor: ${clientName}`}
      icon={Wallet}
    >
      <div className="space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Încasat Total</span>
            <div className="text-2xl font-black leading-none text-emerald-900 dark:text-emerald-100">{totalPaid} RON</div>
            <div className="flex items-center gap-1 text-[10px] font-bold italic text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" /> Eficiență 100%
            </div>
          </div>
          <div className="space-y-1 rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">De Încasat</span>
            <div className="text-2xl font-black leading-none text-amber-900 dark:text-amber-100">{totalPending} RON</div>
            <div className="flex items-center gap-1 text-[10px] font-bold italic text-amber-700 dark:text-amber-300">
              <CalendarClock className="h-3 w-3" /> Sesiuni nefacturate
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Listă Tranzacții</h3>
            <Badge variant="outline" className="text-[10px] font-bold">{payments.length} înregistrări</Badge>
          </div>
          
          <div className="space-y-3 pb-8">
            {payments.length === 0 ? (
              <div className="rounded-[1.75rem] border-2 border-dashed border-border/60 p-10 text-center text-sm font-bold italic text-muted-foreground">
                Nicio tranzacție înregistrată încă.
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="group flex items-center justify-between rounded-[1.25rem] border border-border/60 bg-card p-4 transition-all hover:border-primary/20 hover:bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black shadow-sm ring-1 ring-inset",
                      isPaidInvoiceStatus(payment.status)
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-900" 
                        : "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-900"
                    )}>
                      {payment.amount}
                    </div>
                    <div>
                      <p className="text-sm font-black leading-tight text-foreground">
                        {payment.smartbill_series && payment.smartbill_number
                          ? `Factura ${payment.smartbill_series}-${payment.smartbill_number}`
                          : "Ședință Terapie"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {payment.issued_at
                          ? format(new Date(payment.issued_at), "d MMM yyyy", { locale: ro })
                          : "Dată indisponibilă"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isPaidInvoiceStatus(payment.status) ? "success" : "warning"}
                      className="text-[9px] uppercase font-black tracking-widest px-2 h-5"
                    >
                      {payment.status ?? "NECUNOSCUT"}
                    </Badge>
                    <button className="rounded-xl border border-border/60 bg-background p-2 text-muted-foreground opacity-0 transition-all hover:text-primary group-hover:opacity-100">
                      <Receipt className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SectionDetailOverlay>
  );
}
