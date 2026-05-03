"use client";
import { AlertCircle, History, Plus, ShieldAlert, Trash2, Clock } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import type { CrisisNoteItem } from "./types";

interface CrisisNotesDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  notes: CrisisNoteItem[];
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
        <div className="flex items-start gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
             <p className="text-xs font-black uppercase tracking-tight text-destructive">Monitorizare Intensă Activă</p>
             <p className="text-[10px] font-bold leading-relaxed italic text-destructive/80">
               Notele de criză sunt documentate pentru gestionarea situațiilor de risc ridicat. Acestea nu sunt incluse în raportările standard către terți.
             </p>
          </div>
        </div>

        {/* Notes List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Istoric Note de Criză
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary">
              <Plus className="h-3 w-3 mr-1" /> Notă Nouă
            </Button>
          </div>

          <div className="space-y-5 pb-10">
            {notes.length === 0 ? (
               <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-12 text-center">
                <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-bold italic text-muted-foreground">Nicio notă de criză înregistrată.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="relative space-y-2 pl-6 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:rounded-full before:bg-rose-200 dark:before:bg-rose-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-black tracking-tight text-muted-foreground">
                        {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}
                      </span>
                    </div>
                    <button className="p-1 text-muted-foreground/50 transition-colors hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm font-medium leading-relaxed text-foreground shadow-sm">
                    {note.content ?? note.summary ?? "Fără conținut disponibil."}
                  </div>
                  {note.severity && (
                    <div className="flex gap-2">
                       <div className="rounded-full bg-destructive px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-destructive-foreground">
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
