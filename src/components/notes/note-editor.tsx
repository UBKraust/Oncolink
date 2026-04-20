"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Check,
  ClipboardList,
  Cpu,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveEncryptedNote } from "@/app/dashboard/notes/actions";
import { decryptNote, encryptNote } from "@/lib/crypto/notes";
import { buildPrompt, runOllama, type AiAction } from "@/lib/ollama/client";

import { useNotesVault } from "./notes-context";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NoteEditorProps {
  appointmentId: string;
  initialCiphertext: string | null;
  updatedAt: string | null;
}

export function NoteEditor({
  appointmentId,
  initialCiphertext,
  updatedAt,
}: NoteEditorProps) {
  const { status, key } = useNotesVault();
  const [plaintext, setPlaintext] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(updatedAt);

  const [aiRunning, setAiRunning] = useState<AiAction | null>(null);
  const [aiOutput, setAiOutput] = useState<string>("");
  const [aiError, setAiError] = useState<string | null>(null);
  const aiAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!key) return;
    if (!initialCiphertext) {
      setPlaintext("");
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const plain = await decryptNote(initialCiphertext, key);
        if (!cancelled) {
          setPlaintext(plain);
          setLoaded(true);
          setDecryptError(null);
        }
      } catch {
        if (!cancelled) {
          setDecryptError(
            "Nu am putut decripta nota cu PIN-ul curent. Notele existente au fost criptate cu alt PIN.",
          );
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, initialCiphertext]);

  const handleSave = useCallback(async () => {
    if (!key) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const ciphertext = await encryptNote(plaintext, key);
      const res = await saveEncryptedNote(appointmentId, ciphertext);
      if (!res.ok) {
        setSaveStatus("error");
        setSaveError(res.error);
        return;
      }
      setSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setSaveStatus("error");
      setSaveError((e as Error).message);
    }
  }, [appointmentId, key, plaintext]);

  const runAi = useCallback(
    async (action: AiAction) => {
      if (!plaintext.trim()) {
        setAiError("Nu există text în notă.");
        return;
      }
      aiAbort.current?.abort();
      const controller = new AbortController();
      aiAbort.current = controller;

      setAiRunning(action);
      setAiError(null);
      setAiOutput("");
      try {
        const full = await runOllama(buildPrompt(action, plaintext), {
          signal: controller.signal,
          onChunk: (partial) => setAiOutput(partial),
        });
        setAiOutput(full);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setAiError((e as Error).message);
        }
      } finally {
        setAiRunning(null);
      }
    },
    [plaintext],
  );

  const appendAi = () => {
    if (!aiOutput.trim()) return;
    setPlaintext((t) => (t.trim() ? `${t}\n\n${aiOutput}` : aiOutput));
    setAiOutput("");
  };

  if (status === "loading") {
    return <SkeletonCard />;
  }

  if (status !== "unlocked" || !key) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Vault blocat
          </CardTitle>
          <CardDescription>
            {status === "needs-setup"
              ? "Setează un PIN din bara de sus pentru a putea scrie note."
              : "Deblochează cu PIN-ul tău din bara de sus pentru a citi sau scrie această notă."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Editor criptat</CardTitle>
            <CardDescription>
              {lastSavedAt
                ? `Ultima salvare: ${format(new Date(lastSavedAt), "d MMM yyyy · HH:mm", { locale: ro })}`
                : "Încă nesalvată"}
            </CardDescription>
          </div>
          <SaveStatusBadge status={saveStatus} />
        </CardHeader>
        <CardContent className="space-y-3">
          {decryptError ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{decryptError}</span>
            </div>
          ) : null}

          <Textarea
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Poți nota aici — totul este criptat local înainte să ajungă la server."
            rows={14}
            disabled={!loaded}
            className="font-mono text-sm"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              AES-GCM 256 · PIN-ul nu părăsește dispozitivul
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saveStatus === "saving" || !loaded}
                size="sm"
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvează criptat
              </Button>
            </div>
          </div>

          {saveError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {saveError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" />
            Asistent AI local
          </CardTitle>
          <CardDescription>
            Rulează pe{" "}
            {process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434"} ·
            model {process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct"}
            . Textul notei nu părăsește niciodată această mașină.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!!aiRunning || !plaintext.trim()}
              onClick={() => runAi("SOAP")}
            >
              {aiRunning === "SOAP" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Format SOAP
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!!aiRunning || !plaintext.trim()}
              onClick={() => runAi("PROGRES")}
            >
              {aiRunning === "PROGRES" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              Raport progres
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!!aiRunning || !plaintext.trim()}
              onClick={() => runAi("TEME")}
            >
              {aiRunning === "TEME" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
              Extrage teme
            </Button>
            {aiRunning ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => aiAbort.current?.abort()}
              >
                Anulează
              </Button>
            ) : null}
          </div>

          {aiError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {aiError}
            </p>
          ) : null}

          {aiOutput ? (
            <div className="space-y-2">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
                {aiOutput}
              </pre>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiOutput("")}
                  disabled={!!aiRunning}
                >
                  Renunță
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={appendAi}
                  disabled={!!aiRunning}
                >
                  Adaugă în notă
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Se salvează…
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Salvat criptat
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <TriangleAlert className="h-3 w-3" />
        Eroare la salvare
      </span>
    );
  return null;
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </CardContent>
    </Card>
  );
}
