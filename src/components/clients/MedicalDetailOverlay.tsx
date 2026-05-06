"use client";
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
  isLoading?: boolean;
  clientName: string;
}

export function MedicalDetailOverlay({ 
  isOpen, 
  onClose, 
  documents, 
  medications, 
  isLoading = false,
  clientName 
}: MedicalDetailOverlayProps) {
  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Dosar Medical & Arhivă"
      subtitle={`Pacient: ${clientName}`}
      icon={FileText}
      size="lg"
    >
      <div className="space-y-10">
        {/* Medications Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Pill className="h-3.5 w-3.5" /> Tratament Curent
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary">
              <Plus className="h-3 w-3 mr-1" /> Adaugă Medicație
            </Button>
          </div>
          
          <div className="grid gap-3">
            {isLoading ? (
              <div className="rounded-2xl border-2 border-dashed border-border/60 p-8 text-center text-xs font-medium italic text-muted-foreground">
                Se încarcă tratamentul curent...
              </div>
            ) : medications.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/60 p-8 text-center text-xs font-medium italic text-muted-foreground">
                Niciun medicament înregistrat.
              </div>
            ) : (
              medications.map((m, idx) => (
                <div key={idx} className="flex items-start justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:bg-muted/20">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-primary shadow-sm">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black leading-tight text-foreground">{m.name}</p>
                      <p className="mb-2 max-w-[200px] truncate text-xs font-bold text-primary">
                        Dozaj: {m.dosage}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-background text-[9px] font-black leading-none">
                          {m.frequency}
                        </Badge>
                        {m.prescribed_by && (
                          <Badge variant="outline" className="bg-background text-[9px] font-bold text-muted-foreground">
                            Dr. {m.prescribed_by}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="h-5 px-2 text-[9px] font-black uppercase tracking-widest">
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
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Arhivă Documente & Fișiere
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {documents.length} Fișiere
            </span>
          </div>

          <div className="grid gap-2">
            {isLoading ? (
               <div className="rounded-2xl border-2 border-dashed border-border/60 p-8 text-center text-xs font-medium italic text-muted-foreground">
                Se încarcă arhiva documentelor...
              </div>
            ) : documents.length === 0 ? (
               <div className="rounded-2xl border-2 border-dashed border-border/60 p-8 text-center text-xs font-medium italic text-muted-foreground">
                Arhiva este goală.
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div key={idx} className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 pl-4 transition-all hover:border-primary/20 hover:bg-muted/20 hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/20 text-muted-foreground transition-colors group-hover:text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="max-w-[180px] truncate text-xs font-black leading-none text-foreground">
                        {doc.file_name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground">
                        {doc.document_type || "Fișier"}{doc.created_at ? ` • ${format(new Date(doc.created_at), "d MMM yyyy", { locale: ro })}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            <Button variant="outline" className="mt-4 h-12 w-full rounded-2xl border-2 border-dashed border-border/60 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/20">
              <Plus className="h-4 w-4 mr-2" /> Încarcă document nou
            </Button>
          </div>
        </section>

        {/* Informative Alert */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
               <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-tight text-foreground">Sănătate & Confidențialitate</p>
              <p className="text-[11px] font-bold leading-relaxed italic text-muted-foreground">
                Documentele încărcate în Seiful Digital sunt tratate ca informații sensibile. Accesul și păstrarea lor trebuie configurate în acord cu procedurile interne și obligațiile legale ale cabinetului.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SectionDetailOverlay>
  );
}
