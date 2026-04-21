"use client";

import React from "react";
import { AlertCircle, History, Plus, ShieldAlert, Trash2, Clock } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface CrisisNotesDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  notes: any[];
  clientName: string;
}

export function CrisisNotesDetailOverlay({ isOpen, onClose, notes, clientName }: CrisisNotesDetailOverlayProps) {
  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Protocol Monitorizare"
      subtitle={`Note Management Criză: ${clientName}`}
      icon={ShieldAlert}
    >
      <div className="space-y-8">
        {/* Info Banner */}
        <div className="p-5 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-start gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
             <p className="text-xs font-black text-rose-900 uppercase tracking-tight">Monitorizare Intensă Activă</p>
             <p className="text-[10px] font-bold text-rose-700 leading-relaxed italic">
               Notele de criză sunt documentate pentru gestionarea situațiilor de risc ridicat. Acestea nu sunt incluse în raportările standard către terți.
             </p>
          </div>
        </div>

        {/* Notes List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Istoric Note de Criză
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <Plus className="h-3 w-3 mr-1" /> Notă Nouă
            </Button>
          </div>

          <div className="space-y-5 pb-10">
            {notes.length === 0 ? (
               <div className="p-12 text-center rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                <ShieldAlert className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400 italic">Nicio notă de criză înregistrată.</p>
              </div>
            ) : (
              notes.map((note, idx) => (
                <div key={idx} className="relative pl-6 space-y-2 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-rose-200 before:rounded-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[11px] font-black text-slate-500 tracking-tight">
                        {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}
                      </span>
                    </div>
                    <button className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-5 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm leading-relaxed text-sm font-medium text-slate-700">
                    {note.content}
                  </div>
                  {note.severity && (
                    <div className="flex gap-2">
                       <div className="px-2 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white uppercase tracking-widest">
                          Risc: {note.severity}
                       </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SectionDetailOverlay>
  );
}
