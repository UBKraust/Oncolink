"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertTriangle, Phone, MessageSquare, Mail, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrisisNoteButton } from "@/components/clients/CrisisNoteButton";
import { deleteCrisisNote, type CrisisNote } from "@/app/dashboard/clients/crisis-notes-actions";

interface Props {
  clientId: string;
  clientName: string;
  initialNotes: CrisisNote[];
}

const CONTACT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  PHONE: Phone,
  SMS: MessageSquare,
  EMAIL: Mail,
};

const CONTACT_LABEL: Record<string, string> = {
  PHONE: "Telefon",
  SMS: "SMS",
  EMAIL: "Email",
};

export function CrisisNotesList({ clientId, clientName, initialNotes }: Props) {
  const [notes, setNotes] = useState<CrisisNote[]>(initialNotes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(noteId: string) {
    setDeletingId(noteId);
    startTransition(async () => {
      const result = await deleteCrisisNote(noteId, clientId);
      if (result.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
      setDeletingId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Note de Criză
          {notes.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {notes.length}
            </Badge>
          )}
        </CardTitle>
        <CrisisNoteButton clientId={clientId} clientName={clientName} />
      </CardHeader>

      <CardContent className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nicio notă de criză înregistrată.
          </p>
        ) : (
          notes.map((n) => {
            const ContactIcon = n.contact_method ? CONTACT_ICON[n.contact_method] : null;
            return (
              <div
                key={n.id}
                className="rounded-md border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="whitespace-pre-wrap text-sm">{n.note}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(n.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
                      </span>
                      {n.contact_method && ContactIcon && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <ContactIcon className="h-3 w-3" />
                          {CONTACT_LABEL[n.contact_method]}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Șterge nota"
                  >
                    {deletingId === n.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
