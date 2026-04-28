"use client";

import React from "react";
import { FileText, Pill, ShieldCheck, Download, Plus } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import type { ClientDocument, ClientMedication } from "./types";

interface MedicalDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ClientDocument[];
  medications: ClientMedication[];
  clientName: string;
}

export function MedicalDetailOverlay({ 
  isOpen, 
  onClose, 
  documents, 
  medications, 
  clientName 
}: MedicalDetailOverlayProps) {
  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Dosar Medical & Arhivă"
      subtitle={`Pacient: ${clientName}`}
      icon={FileText}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-10">
        {/* Medications Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Pill className="h-3.5 w-3.5" /> Tratament Curent
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary">
              <Plus className="h-3 w-3 mr-1" /> Adaugă Medicație
            </Button>
          </div>
          
          <div className="grid gap-3">
            {medications.length === 0 ? (
              <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-medium italic text-xs">
                Niciun medicament înregistrat.
              </div>
            ) : (
              medications.map((m, idx) => (
                <div key={idx} className="flex items-start justify-between p-5 rounded-3xl bg-indigo-50/30 border border-indigo-100 shadow-sm transition-all hover:bg-white hover:border-indigo-200">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-indigo-100 text-indigo-500 shadow-sm">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 leading-tight">{m.name}</p>
                      <p className="text-xs font-bold text-indigo-600 mb-2 truncate max-w-[200px]">
                        Dozaj: {m.dosage}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[9px] font-black leading-none bg-white border-indigo-100 text-indigo-700">
                          {m.frequency}
                        </Badge>
                        {m.prescribed_by && (
                          <Badge variant="outline" className="text-[9px] font-bold bg-white border-slate-200 text-slate-500">
                            Dr. {m.prescribed_by}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest px-2 h-5">
                    Activ
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Documents Archive */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Arhivă Documente & Fișiere
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {documents.length} Fișiere
            </span>
          </div>

          <div className="grid gap-2">
            {documents.length === 0 ? (
               <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-medium italic text-xs">
                Arhiva este goală.
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 pl-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:text-primary transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[180px]">
                        {doc.file_name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mt-1">
                        {doc.document_type || "Fișier"}{doc.created_at ? ` • ${format(new Date(doc.created_at), "d MMM yyyy", { locale: ro })}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-xl">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            <Button variant="outline" className="mt-4 w-full h-12 rounded-[1.5rem] border-dashed border-2 border-slate-100 text-slate-400 font-black hover:border-primary/30 hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px]">
              <Plus className="h-4 w-4 mr-2" /> Încarcă document nou
            </Button>
          </div>
        </section>

        {/* Informative Alert */}
        <section className="p-6 rounded-[2.5rem] bg-slate-900 border-none shadow-2xl space-y-3">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
               <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-white uppercase tracking-tight">Sănătate & Confidențialitate</p>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                Documentele încărcate în Seiful Digital sunt tratate ca informații sensibile. Accesul și păstrarea lor trebuie configurate în acord cu procedurile interne și obligațiile legale ale cabinetului.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SectionDetailOverlay>
  );
}
