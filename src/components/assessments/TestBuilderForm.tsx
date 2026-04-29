"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Question, ScoringLogic, ScoringSubscale, TestTemplate } from "@/lib/assessments/types";
import { SectionCard } from "@/components/app/page-shell";

function generateId() {
  return `q${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function emptyQuestion(): Question {
  return {
    id: generateId(),
    text: "",
    options: [
      { label: "Niciodată", value: 0 },
      { label: "Uneori", value: 1 },
      { label: "Deseori", value: 2 },
      { label: "Mereu", value: 3 },
    ],
    reverse_scoring: false,
  };
}

interface Props {
  onSave?: (test: Omit<TestTemplate, "id" | "created_at">) => void;
}

export function TestBuilderForm({ onSave }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [subscales, setSubscales] = useState<ScoringSubscale[]>([]);
  const [newSubscaleName, setNewSubscaleName] = useState("");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // ── Questions ────────────────────────────────────────────────────────────────

  function addQuestion() {
    const q = emptyQuestion();
    setQuestions((prev) => [...prev, q]);
    setExpandedQ(q.id);
  }

  function updateQuestion(id: string, changes: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...changes } : q))
    );
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSubscales((prev) =>
      prev.map((s) => ({ ...s, question_ids: s.question_ids.filter((qid) => qid !== id) }))
    );
  }

  function updateOption(qId: string, optIdx: number, field: "label" | "value", val: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const options = [...q.options];
        options[optIdx] = {
          ...options[optIdx],
          [field]: field === "value" ? parseFloat(val) || 0 : val,
        };
        return { ...q, options };
      })
    );
  }

  function addOption(qId: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: [...q.options, { label: "", value: q.options.length }] }
          : q
      )
    );
  }

  function removeOption(qId: string, optIdx: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.filter((_, i) => i !== optIdx) }
          : q
      )
    );
  }

  // ── Subscales ────────────────────────────────────────────────────────────────

  function addSubscale() {
    if (!newSubscaleName.trim()) return;
    setSubscales((prev) => [
      ...prev,
      { name: newSubscaleName.trim(), question_ids: [] },
    ]);
    setNewSubscaleName("");
  }

  function toggleQuestionInSubscale(subscaleName: string, qId: string) {
    setSubscales((prev) =>
      prev.map((s) => {
        if (s.name !== subscaleName) return s;
        const already = s.question_ids.includes(qId);
        return {
          ...s,
          question_ids: already
            ? s.question_ids.filter((id) => id !== qId)
            : [...s.question_ids, qId],
        };
      })
    );
  }

  function removeSubscale(name: string) {
    setSubscales((prev) => prev.filter((s) => s.name !== name));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    const scoringLogic: ScoringLogic =
      subscales.length > 0
        ? { type: "SUBSCALES", subscales }
        : { type: "SUM" };

    onSave?.({ name, description, questions, scoring_logic: scoringLogic });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Meta */}
      <SectionCard
        title="Informații test"
        description="Definește identitatea clinică a testului înainte de a adăuga întrebările."
      >
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Denumire Test</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Scala de Evaluare Personalizată"
            />
          </div>
          <div className="space-y-2">
            <Label>Descriere</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scurtă descriere clinică..."
            />
          </div>
        </CardContent>
      </SectionCard>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black tracking-tight">Întrebări ({questions.length})</h3>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" /> Adaugă Întrebare
          </Button>
        </div>

        {questions.map((q, idx) => (
          <Card key={q.id} className="overflow-hidden rounded-[1.5rem] border-border/60 shadow-sm">
            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}.</span>
              <span className="flex-1 text-sm truncate">{q.text || "Întrebare fără text..."}</span>
              {q.reverse_scoring && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                  INVERS
                </span>
              )}
              <span className="text-xs text-muted-foreground">{q.options.length} opț.</span>
              {expandedQ === q.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-rose-500 hover:text-rose-700"
                onClick={(e) => {
                  e.stopPropagation();
                  removeQuestion(q.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {expandedQ === q.id && (
              <CardContent className="space-y-4 border-t border-border/60 bg-muted/20 px-4 pb-4 pt-4">
                <div className="space-y-2">
                  <Label>Text Întrebare</Label>
                  <Input
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder="Introduceți textul întrebării..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`rev-${q.id}`}
                    checked={q.reverse_scoring ?? false}
                    onChange={(e) => updateQuestion(q.id, { reverse_scoring: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor={`rev-${q.id}`} className="text-sm cursor-pointer">
                    Scoring Invers (max − valoare)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Opțiuni de răspuns</Label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background p-2">
                      <Input
                        value={opt.label}
                        onChange={(e) => updateOption(q.id, oIdx, "label", e.target.value)}
                        placeholder="Etichetă..."
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1 w-24">
                        <span className="text-xs text-muted-foreground">Val:</span>
                        <Input
                          type="number"
                          value={opt.value}
                          onChange={(e) => updateOption(q.id, oIdx, "value", e.target.value)}
                          className="w-16 text-center"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                        onClick={() => removeOption(q.id, oIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addOption(q.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Opțiune nouă
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Subscales */}
      <SectionCard
        title="Sub-scale scoring"
        description="Grupează întrebările în dimensiuni clinice separate, dacă vrei scoruri pe arii distincte."
      >
        <CardContent className="space-y-4 p-6">
          <div className="flex gap-2">
            <Input
              value={newSubscaleName}
              onChange={(e) => setNewSubscaleName(e.target.value)}
              placeholder="Denumire subscală (ex: Cognitiv, Somatic...)"
              onKeyDown={(e) => e.key === "Enter" && addSubscale()}
            />
            <Button onClick={addSubscale} variant="outline">Adaugă</Button>
          </div>

          {subscales.map((sub) => (
            <div key={sub.name} className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{sub.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-500"
                  onClick={() => removeSubscale(sub.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const assigned = sub.question_ids.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleQuestionInSubscale(sub.name, q.id)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                        assigned
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border/60 hover:border-primary"
                      }`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {sub.question_ids.length} întrebări selectate
              </p>
            </div>
          ))}
        </CardContent>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!name.trim() || questions.length === 0}>
          Salvează Testul
        </Button>
      </div>
    </div>
  );
}
