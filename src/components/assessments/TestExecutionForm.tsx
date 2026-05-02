"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Cpu, Brain, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { calculateTestScore } from "@/lib/assessments/scoringEngine";
import type { TestTemplate, RawAnswers, CalculatedScore } from "@/lib/assessments/types";
import { saveAssessmentAction } from "@/app/dashboard/assessments/actions";
import { useNotesVault } from "@/components/notes/notes-context";
import { encryptNote } from "@/lib/crypto/notes";

const SEVERITY_COLORS: Record<string, string> = {
  minimal: "success",
  mild:    "warning",
  moderate:"warning",
  severe:  "destructive",
};

interface Props {
  test: TestTemplate;
  clientId: string;
  clientName?: string;
}

export function TestExecutionForm({ test, clientId, clientName = "Pacient" }: Props) {
  const { key, status } = useNotesVault();
  const [answers, setAnswers] = useState<RawAnswers>({});
  const [score, setScore] = useState<CalculatedScore | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isSafetyPlan = test.meta?.isSafetyPlan === true;

  // textarea and info questions don't block completion
  const scorableQuestions = test.questions.filter(
    (q) => q.type !== "info"
  );
  const allAnswered = scorableQuestions.every((q) => {
    if (q.type === "textarea") return true; // text fields are optional
    return answers[q.id] !== undefined;
  });

  function handleFinish() {
    const result = calculateTestScore(answers, test.scoring_logic, test.questions);
    setScore(result);
    setAiText(null);
    setAiError(null);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleAiInterpret() {
    if (!score || isSafetyPlan) return;
    setAiLoading(true);
    setAiError(null);
    setAiText(null);

    const subscaleText =
      Object.keys(score.subscales).length > 0
        ? `Sub-scale: ${Object.entries(score.subscales)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}.`
        : "";

    const prompt =
      `You are a clinical psychologist. The patient "${clientName}" took the "${test.name}" test. ` +
      `They scored a total of ${score.total}. ${subscaleText} ` +
      (score.interpretation ? `The clinical band is: "${score.interpretation}". ` : "") +
      `Write a brief, professional 3-sentence clinical interpretation in Romanian for the medical record. ` +
      `Be factual and avoid speculation.`;

    const ollamaUrl   = process.env.NEXT_PUBLIC_OLLAMA_URL   ?? "http://localhost:11434";
    const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct";

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: ollamaModel, prompt, stream: false }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { response: string };
      setAiText(data.response.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(
        msg.includes("fetch")
          ? "Ollama nu este pornit. Rulează `ollama serve` pe laptop și încearcă din nou."
          : `Eroare AI: ${msg}`
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (!score) return;
    if (status !== "unlocked") {
      setSaveError("Seiful Digital este închis. Deblochează-l pentru a salva rezultatele.");
      return;
    }

    setSaveError(null);
    startTransition(async () => {
      try {
        const fullInterpretation = aiText || score.interpretation || "";

        // build text summary from textarea answers
        const textAnswers = test.questions
          .filter((q) => q.type === "textarea" && answers[q.id])
          .map((q) => `${q.text}: ${answers[q.id]}`)
          .join("\n\n");

        const combinedSummary = [textAnswers, fullInterpretation].filter(Boolean).join("\n\n---\n\n");

        let encrypted: string | undefined;
        if (key) {
          encrypted = await encryptNote(combinedSummary, key);
        }

        const result = await saveAssessmentAction({
          clientId,
          assessmentType: test.name,
          scoringData: score,
          contentSummary: combinedSummary,
          encryptedContent: encrypted,
        });

        if (result.ok) {
          setSaveSuccess(true);
        } else {
          setSaveError(result.error ?? "Eroare necunoscută la salvare.");
        }
      } catch (e) {
        setSaveError("Eroare la criptare: " + (e as Error).message);
      }
    });
  }

  const band = score
    ? test.scoring_logic.interpretation_bands?.find(
        (b) => score.total >= b.min && score.total <= b.max
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Questions */}
      {!score && (
        <>
          <div className="space-y-6">
            {test.questions.map((q, idx) => {
              // ── Info block ────────────────────────────────────────────────
              if (q.type === "info") {
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                    <span>{q.text}</span>
                  </div>
                );
              }

              // ── Textarea ──────────────────────────────────────────────────
              if (q.type === "textarea") {
                return (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {q.text}
                    </Label>
                    <Textarea
                      placeholder={q.placeholder}
                      rows={3}
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="resize-none text-sm"
                    />
                  </div>
                );
              }

              // ── Scale (0–10 horizontal radio) ─────────────────────────────
              if (q.type === "scale") {
                return (
                  <div key={q.id} className="space-y-3">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {q.text}
                    </p>
                    {q.scaleLabel && (
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>{q.scaleLabel.min}</span>
                        <span>{q.scaleLabel.max}</span>
                      </div>
                    )}
                    <RadioGroup
                      value={answers[q.id]?.toString()}
                      onValueChange={(v) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v) }))
                      }
                      className="flex flex-wrap gap-2"
                    >
                      {q.options.map((opt) => (
                        <div key={opt.value} className="flex flex-col items-center gap-1">
                          <div
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                              answers[q.id] === opt.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            }`}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                            }
                          >
                            <RadioGroupItem
                              value={opt.value.toString()}
                              id={`${q.id}-${opt.value}`}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`${q.id}-${opt.value}`}
                              className="cursor-pointer text-sm"
                            >
                              {opt.label}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                );
              }

              // ── Radio (default) ───────────────────────────────────────────
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {q.text}
                  </p>
                  <RadioGroup
                    value={answers[q.id]?.toString()}
                    onValueChange={(v) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v) }))
                    }
                    className="flex flex-col gap-1.5"
                  >
                    {q.options.map((opt) => (
                      <div
                        key={opt.value}
                        className={`flex items-center gap-3 rounded border p-3 transition-colors cursor-pointer ${
                          answers[q.id] === opt.value
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={opt.value.toString()}
                          id={`${q.id}-${opt.value}`}
                        />
                        <Label
                          htmlFor={`${q.id}-${opt.value}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}
          </div>

          <Button onClick={handleFinish} disabled={!allAnswered} className="w-full">
            Finalizare & Calculează Scorul
          </Button>
          {!allAnswered && (
            <p className="text-xs text-center text-muted-foreground">
              Răspunde la toate întrebările obligatorii pentru a continua.
            </p>
          )}
        </>
      )}

      {/* Score Result */}
      {score && (
        <Card className="flex flex-col rounded-2xl border bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-success" />
                Rezultat
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setScore(null); setAiText(null); }}
                className="text-xs text-muted-foreground"
              >
                Reluare
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Total + interpretation band */}
            {(score.total > 0 || test.scoring_logic.interpretation_bands) && (
              <div className="flex items-center gap-4">
                <div className="rounded-xl border-2 px-6 py-4 text-center">
                  <p className="text-4xl font-bold">{score.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Scor Total</p>
                </div>
                {band && (
                  <Badge
                    variant={SEVERITY_COLORS[band.severity ?? "minimal"] as "success" | "warning" | "destructive"}
                    className="h-auto px-3 py-1.5 text-sm"
                  >
                    {score.interpretation}
                  </Badge>
                )}
              </div>
            )}

            {/* Subscales */}
            {Object.keys(score.subscales).length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(score.subscales).map(([name, val]) => (
                  <div key={name} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                    <p className="text-xl font-semibold">{val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea answers summary */}
            {test.questions.some((q) => q.type === "textarea" && answers[q.id]) && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Răspunsuri text</p>
                {test.questions
                  .filter((q) => q.type === "textarea" && answers[q.id])
                  .map((q) => (
                    <div key={q.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground mb-1">{q.text}</p>
                      <p className="text-sm whitespace-pre-wrap">{answers[q.id] as string}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* AI section — blocked for safety plans */}
            {!isSafetyPlan && (
              <div className="border-t pt-4 space-y-3">
                {!aiText && !aiError && (
                  <Button
                    variant="outline"
                    onClick={handleAiInterpret}
                    disabled={aiLoading}
                    className="w-full gap-2"
                  >
                    <Cpu className="h-4 w-4" />
                    {aiLoading
                      ? "Gemma analizează local..."
                      : "Interpretare clinică cu Gemma (AI Local)"}
                  </Button>
                )}

                {aiError && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {aiError}
                  </div>
                )}

                {aiText && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Interpretare Clinică (AI)</span>
                    </div>
                    <Textarea
                      rows={5}
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      className="resize-none text-sm leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Revizuiți și ajustați textul înainte de salvare. AI-ul nu înlocuiește judecata clinică.
                    </p>
                  </div>
                )}
              </div>
            )}

            {saveError && (
              <p className="text-xs font-medium text-destructive">{saveError}</p>
            )}
            {saveSuccess && (
              <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-xs font-semibold text-success">
                Salvat în dosarul clientului.
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/60">
            <Button
              className="ml-auto"
              onClick={handleSave}
              disabled={isPending || saveSuccess}
            >
              {isPending ? "Se salvează..." : saveSuccess ? "Salvat!" : "Salvează în Dosarul Clientului"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
