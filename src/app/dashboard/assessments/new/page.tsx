"use client";

import { useState } from "react";
import { ChevronLeft, Brain, Cpu, CheckCircle } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { mockPsychologicalTests, PsychologicalTest } from "@/lib/mock/psychological_tests";

export default function NewAssessmentPage() {
  const [selectedTest, setSelectedTest] = useState<PsychologicalTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [scoreResult, setScoreResult] = useState<Record<string, number> | null>(null);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleCalculateMath = () => {
    if (!selectedTest) return;
    
    // HARDCODED MATH LOGIC
    let computed: Record<string, number> = {};
    const { scoring_logic } = selectedTest;

    if (scoring_logic.type === "SUM") {
      let sum = 0;
      Object.values(answers).forEach((val) => { sum += val; });
      computed["Total Score"] = sum;
    } else if (scoring_logic.type === "SUBSCALES" && scoring_logic.subscales) {
      Object.entries(scoring_logic.subscales).forEach(([subscaleName, questionsIds]) => {
        let subSum = 0;
        questionsIds.forEach(qId => {
          if (answers[qId] !== undefined) subSum += answers[qId];
        });
        computed[subscaleName] = subSum;
      });
      // also calculate total
      let sum = 0;
      Object.values(answers).forEach((val) => { sum += val; });
      computed["Total General"] = sum;
    }

    setScoreResult(computed);
  };

  const handleMagicAI = async () => {
    if (!selectedTest || !scoreResult) return;
    
    setAiLoading(true);
    
    try {
      // Prompt construction
      const prompt = `Clientul a obtinut urmatoarele scoruri la testul ${selectedTest.name}: ${JSON.stringify(scoreResult)}. Genereaza un scurt paragraf (3 propozitii) de interpretare psihologica clinica pentru fisa pacientului, in limba romana. Fii obiectiv si profesional.`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma:2b", // or gemma2:9b if installed
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error("Ollama connection failed");
      }

      const data = await response.json();
      setAiAnalysis(data.response);

    } catch (error) {
      console.error(error);
      setAiAnalysis("[SERVER OLLAMA INDISPONIBIL] Simulăm un răspuns AI în lipsa conexiunii localhost:11434... Pe baza scorurilor introduse, simptomatologia generală pare să indice nivele moderate de distres emoțional. Este necesară explorarea amănunțită a mecanismelor de coping în cadrul ședințelor viitoare, cu un focus pe subscalele cele mai elevate.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-10">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluare Nouă</h1>
        <p className="text-sm text-muted-foreground mt-1">Alege un test și completează formularul digital.</p>
      </div>

      {!selectedTest ? (
        <div className="grid gap-4 mt-6">
          {mockPsychologicalTests.map(test => (
            <Card key={test.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTest(test)}>
              <CardHeader>
                <CardTitle>{test.name}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-primary">{selectedTest.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTest(null); setAnswers({}); setScoreResult(null); setAiAnalysis(null); }}>Schimbă Test</Button>
              </div>
              <CardDescription>{selectedTest.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {selectedTest.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <Label className="text-base font-medium">
                    {idx + 1}. {q.text}
                  </Label>
                  <RadioGroup 
                    className="flex flex-col gap-2"
                    value={answers[q.id]?.toString()}
                    onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: parseInt(val) }))}
                  >
                    {q.options.map(opt => (
                      <div key={`${q.id}-${opt.value}`} className="flex items-center space-x-2 rounded border p-3 hover:bg-muted/50">
                        <RadioGroupItem value={opt.value.toString()} id={`${q.id}-${opt.value}`} />
                        <Label htmlFor={`${q.id}-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleCalculateMath} className="w-full">
                Finalizare & Calcul Scor (Matematic)
              </Button>
            </CardFooter>
          </Card>

          {scoreResult && (
            <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-lg">
                  <CheckCircle className="h-5 w-5" />
                  Scoruri Calculate Matematic
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(scoreResult).map(([k, v]) => (
                    <div key={k} className="rounded border bg-background p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase mb-1">{k}</p>
                      <p className="text-2xl font-bold">{v}</p>
                    </div>
                  ))}
                </div>

                {!aiAnalysis ? (
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2 w-full sm:w-auto bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950 border-indigo-200 text-indigo-700 dark:text-indigo-300"
                    onClick={handleMagicAI}
                    disabled={aiLoading}
                  >
                    <img src="/assets/ollama-icon.svg" className="w-4 h-4 opacity-70" alt="" onError={(e) => e.currentTarget.style.display='none'} />
                    <Cpu className="h-4 w-4" />
                    {aiLoading ? "Gemma analizează local..." : "Interpretează clinic cu Gemma (Local AI)"}
                  </Button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-900 dark:text-purple-300 text-sm">Analiza Clinică Generată de AI</span>
                    </div>
                    <textarea 
                      className="w-full p-4 rounded-md border bg-background text-sm leading-relaxed focus:ring-purple-500 focus:border-purple-500"
                      rows={5}
                      defaultValue={aiAnalysis}
                    />
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => alert("Salvat în fișa clientului!")}>Salvează în Dosar</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
