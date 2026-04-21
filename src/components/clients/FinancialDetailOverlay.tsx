"use client";

import React from "react";
import { CreditCard, Wallet, TrendingUp, Receipt, CalendarClock, ExternalLink } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FinancialDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  clientName: string;
}

export function FinancialDetailOverlay({ isOpen, onClose, payments, clientName }: FinancialDetailOverlayProps) {
  const totalPaid = payments.filter(p => p.invoice_status === "ACHITATĂ").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.invoice_status === "EMISĂ").reduce((sum, p) => sum + p.amount, 0);

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
          <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Încasat Total</span>
            <div className="text-2xl font-black text-emerald-900 leading-none">{totalPaid} RON</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold italic">
              <TrendingUp className="h-3 w-3" /> Eficiență 100%
            </div>
          </div>
          <div className="p-5 rounded-[2rem] bg-amber-50 border border-amber-100 space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">De Încasat</span>
            <div className="text-2xl font-black text-amber-900 leading-none">{totalPending} RON</div>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold italic">
              <CalendarClock className="h-3 w-3" /> Sesiuni nefacturate
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listă Tranzacții</h3>
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200">{payments.length} înregistrări</Badge>
          </div>
          
          <div className="space-y-3 pb-8">
            {payments.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-bold italic text-sm">
                Nicio tranzacție înregistrată încă.
              </div>
            ) : (
              payments.map((p, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-xl font-black text-xs shadow-sm ring-1 ring-inset",
                      p.invoice_status === "ACHITATĂ" 
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-200" 
                        : "bg-amber-50 text-amber-600 ring-amber-200"
                    )}>
                      {p.amount}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">
                        {p.session_type || "Ședință Terapie"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {format(new Date(p.appointment_date), "d MMM yyyy", { locale: ro })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={p.invoice_status === "ACHITATĂ" ? "success" : "warning"} className="text-[9px] uppercase font-black tracking-widest px-2 h-5">
                      {p.invoice_status}
                    </Badge>
                    <button className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm shadow-slate-200/50">
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
