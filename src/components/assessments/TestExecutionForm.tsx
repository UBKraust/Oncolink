"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Cpu, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { calculateTestScore } from "@/lib/assessments/scoringEngine";
import type { TestTemplate, RawAnswers, CalculatedScore } from "@/lib/assessments/types";
import { saveAssessmentAction } from "@/app/dashboard/assessments/actions";
import { useNotesVault } from "@/components/notes/notes-context";
import { encryptNote } from "@/lib/crypto/notes";

const SEVERITY_COLORS: Record<string, string> = {
  minimal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  mild:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  moderate:"bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  severe:  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
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

  const allAnswered = test.questions.every((q) => answers[q.id] !== undefined);

  function handleFinish() {
    const result = calculateTestScore(answers, test.scoring_logic, test.questions);
    setScore(result);
    setAiText(null);
    setAiError(null);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleAiInterpret() {
    if (!score) return;
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

    const ollamaUrl =
      process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";
    const ollamaModel =
      process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct";

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { response: string };
      setAiText(data.response.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("fetch")) {
        setAiError(
          "Ollama nu este pornit. Rulează `ollama serve` pe laptop și încearcă din nou."
        );
      } else {
        setAiError(`Eroare AI: ${msg}`);
      }
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
        let encrypted: string | undefined;
        if (key) {
          encrypted = await encryptNote(fullInterpretation, key);
        }

        const result = await saveAssessmentAction({
          clientId,
          assessmentType: test.name,
          scoringData: score,
          contentSummary: fullInterpretation,
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

  // Derive severity badge class
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
          <div className="space-y-5">
            {test.questions.map((q, idx) => (
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
            ))}
          </div>

          <Button
            onClick={handleFinish}
            disabled={!allAnswered}
            className="w-full"
          >
            Finalizare & Calculează Scorul
          </Button>
          {!allAnswered && (
            <p className="text-xs text-center text-muted-foreground">
              Răspunde la toate întrebările pentru a continua.
            </p>
          )}
        </>
      )}

      {/* Score Result */}
      {score && (
        <Card
          className={`border-2 ${
            band?.severity === "severe"
              ? "border-rose-300 dark:border-rose-800"
              : "border-emerald-200 dark:border-emerald-900"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Rezultat Calculat Matematic
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setScore(null); setAiText(null); }}
                className="text-xs text-muted-foreground"
              >
                Reluare test
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total */}
            <div className="flex items-center gap-4">
              <div className="rounded-xl border-2 px-6 py-4 text-center">
                <p className="text-4xl font-bold">{score.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Scor Total</p>
              </div>
              {band && (
                <Badge
                  className={`text-sm px-3 py-1.5 h-auto ${
                    SEVERITY_COLORS[band.severity ?? "minimal"]
                  }`}
                >
                  {score.interpretation}
                </Badge>
              )}
            </div>

            {/* Subscales */}
            {Object.keys(score.subscales).length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(score.subscales).map(([name, val]) => (
                  <div key={name} className="rounded-md border bg-muted/30 p-3 text-center">
                    <p className="text-xl font-semibold">{val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* AI Section */}
            <div className="border-t pt-4 space-y-3">
              {!aiText && !aiError && (
                <Button
                  variant="outline"
                  onClick={handleAiInterpret}
                  disabled={aiLoading}
                  className="gap-2 w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-950"
                >
                  <Cpu className="h-4 w-4" />
                  {aiLoading
                    ? "Gemma analizează local..."
                    : "Interpretare Clinică cu Gemma (AI Local)"}
                </Button>
              )}

              {aiError && (
                <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50/50 p-3 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {aiError}
                </div>
              )}

              {aiText && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                      Interpretare Clinică (AI)
                    </span>
                  </div>
                  <textarea
                    className="w-full rounded-md border bg-background p-3 text-sm leading-relaxed resize-none focus-visible:ring-1"
                    rows={5}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Revizuiți și ajustați textul înainte de salvare. AI-ul nu înlocuiește judecata clinică.
                  </p>
                </div>
              )}

              {saveError && (
                <p className="text-xs text-destructive font-medium">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-emerald-600 font-bold">Rezultat salvat cu succes!</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t">
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
