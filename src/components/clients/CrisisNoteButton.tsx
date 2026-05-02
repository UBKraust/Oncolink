"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X, Loader2, Phone, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNotesVault } from "@/components/notes/notes-context";
import { addCrisisNote } from "@/app/dashboard/clients/crisis-notes-actions";
import { encryptNote } from "@/lib/crypto/notes";

interface Props {
  clientId: string;
  clientName: string;
}

const CONTACT_OPTIONS = [
  { value: "PHONE" as const, label: "Telefon", Icon: Phone },
  { value: "SMS" as const, label: "SMS", Icon: MessageSquare },
  { value: "EMAIL" as const, label: "Email", Icon: Mail },
];

export function CrisisNoteButton({ clientId, clientName }: Props) {
  const { key, status } = useNotesVault();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [contactMethod, setContactMethod] = useState<"PHONE" | "SMS" | "EMAIL" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setNote("");
    setContactMethod(null);
    setError(null);
    setSuccess(false);
    setOpen(true);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
  }

  async function handleSubmit() {
    if (!note.trim()) {
      setError("Nota nu poate fi goală.");
      return;
    }

    if (status !== "unlocked") {
      setError("Seiful Digital este închis. Deblochează-l pentru a salva note criptate.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        let encrypted: string | undefined;
        if (key) {
          encrypted = await encryptNote(note.trim(), key);
        }

        const result = await addCrisisNote(clientId, note, contactMethod, encrypted);
        if (result.ok) {
          setSuccess(true);
          setTimeout(() => {
            setOpen(false);
            setSuccess(false);
          }, 1200);
        } else {
          setError(result.error ?? "Eroare necunoscută.");
        }
      } catch (e) {
        setError("Eroare la criptare: " + (e as Error).message);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-amber-700 hover:bg-amber-50/70 hover:text-amber-800 dark:hover:bg-amber-950/30"
        onClick={handleOpen}
        title="Adaugă notă de criză"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Notă urgentă
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="w-full max-w-md rounded-[1.75rem] border border-border/60 bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="font-semibold leading-none">Notă de criză</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{clientName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="crisis-note">Observații / situație</Label>
                <Textarea
                  id="crisis-note"
                  placeholder="Descrie situația, starea pacientului, ce s-a discutat…"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isPending || success}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Contact efectuat (opțional)</Label>
                <div className="flex gap-2">
                  {CONTACT_OPTIONS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContactMethod(contactMethod === value ? null : value)}
                      disabled={isPending || success}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                        contactMethod === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Nota a fost salvată.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Anulează
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || success}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvează nota"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
