"use client";

import { useEffect, useState } from "react";
import { Lock, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useNotesVault } from "./notes-context";

interface PinDialogProps {
  onClose: () => void;
}

/**
 * Parent must unmount this component when closed so local state resets
 * cleanly without a set-state-in-effect pattern.
 */
export function PinDialog({ onClose }: PinDialogProps) {
  const { status, setup, unlock } = useNotesVault();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === "unlocked") onClose();
  }, [status, onClose]);

  const isSetup = status === "needs-setup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (isSetup) {
        if (pin !== confirm) {
          setError("PIN-urile nu se potrivesc.");
          return;
        }
        const res = await setup(pin);
        if (!res.ok) setError(res.error ?? "Eroare la setare PIN.");
      } else {
        const res = await unlock(pin);
        if (!res.ok) setError(res.error ?? "Eroare la deblocare.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-2 border-b p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {isSetup ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {isSetup ? "Setează un PIN pentru note" : "Deblochează notele"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isSetup
                  ? "PIN-ul criptează notele local. Nu părăsește niciodată acest dispozitiv."
                  : "Introdu PIN-ul pentru a decripta notele din această sesiune."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              minLength={4}
              required
            />
          </div>

          {isSetup ? (
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmă PIN</Label>
              <Input
                id="confirm"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={4}
                required
              />
            </div>
          ) : null}

          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          {isSetup ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Dacă pierzi PIN-ul, notele vechi rămân criptate permanent. Nu
              există recuperare prin server.
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={pending || pin.length < 4}>
              {pending
                ? "Se procesează…"
                : isSetup
                  ? "Setează PIN"
                  : "Deblochează"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
