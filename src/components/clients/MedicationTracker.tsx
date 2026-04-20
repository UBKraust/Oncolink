"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Pill, Plus, Pencil, Trash2, X, CheckCircle2, Clock, AlertCircle, Loader2, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MockMedication } from "@/lib/mock/patientFiles";

interface Props {
  clientId: string;
  clientName: string;
  medications: MockMedication[];
}

const EMPTY_MED: Omit<MockMedication, "id" | "client_id"> = {
  medication_name: "",
  dosage: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: null,
  prescribing_doctor: "",
  side_effect_notes: null,
};

export function MedicationTracker({ clientId, clientName, medications: initial }: Props) {
  const [meds, setMeds] = useState<MockMedication[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MockMedication, "id" | "client_id">>(EMPTY_MED);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);

  const active = meds.filter((m) => !m.end_date);
  const inactive = meds.filter((m) => m.end_date);

  function openNew() {
    setForm(EMPTY_MED);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(med: MockMedication) {
    setForm({
      medication_name: med.medication_name,
      dosage: med.dosage,
      start_date: med.start_date,
      end_date: med.end_date,
      prescribing_doctor: med.prescribing_doctor,
      side_effect_notes: med.side_effect_notes,
    });
    setEditId(med.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.medication_name.trim()) return;
    if (editId) {
      setMeds((prev) => prev.map((m) => m.id === editId ? { ...m, ...form } : m));
    } else {
      const newMed: MockMedication = { ...form, id: `med-${Date.now()}`, client_id: clientId };
      setMeds((prev) => [newMed, ...prev]);
    }
    setShowForm(false);
    setEditId(null);
  }

  function handleStop(id: string) {
    setMeds((prev) => prev.map((m) => m.id === id ? { ...m, end_date: new Date().toISOString().slice(0, 10) } : m));
  }

  function handleDelete(id: string) {
    setMeds((prev) => prev.filter((m) => m.id !== id));
  }

  // AI Export — generates a psychiatrist note
  async function handleExportNote() {
    const activeMedsSummary = active.map((m) =>
      `- ${m.medication_name} ${m.dosage} (de la ${m.start_date}, prescris de ${m.prescribing_doctor})` +
      (m.side_effect_notes ? `\n  Efecte secundare raportate: ${m.side_effect_notes}` : "")
    ).join("\n");

    const prompt = `Ești un psiholog clinician. Scrie o notă concisă și profesională în română, adresată medicului psihiatru, referitor la observațiile clinice legate de medicația unui pacient.

Pacient: ${clientName}
Schema medicamentoasă actuală:
${activeMedsSummary}

Redactează o scrisoare medicală de 3-5 propoziții care rezumă observațiile clinice despre cum răspunde pacientul la tratament, ce efecte secundare sunt raportate și dacă există indicii pentru revizuirea schemei. Folosește un ton formal, clinic.`;

    setExportLoading(true);
    setExportText(null);

    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";
    const model = process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct";

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json() as { response: string };
      setExportText(data.response.trim());
    } catch (err) {
      setExportText(`⚠ Eroare AI: ${err instanceof Error ? err.message : "Ollama indisponibil"}`);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Active medications banner */}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900">
          <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 w-full">
            <Pill className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide">Medicație Activă</span>
          </div>
          {active.map((m) => (
            <Badge key={m.id} className="bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-medium">
              {m.medication_name} · {m.dosage}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Pill className="h-4 w-4 text-violet-500" /> Istoric Medicație
        </h4>
        <div className="flex gap-2">
          {active.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportNote} disabled={exportLoading}
              className="gap-1.5 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400">
              {exportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              Notă pentru Psihiatru
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adaugă
          </Button>
        </div>
      </div>

      {/* AI-generated psychiatrist note */}
      {exportText && (
        <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-violet-800 dark:text-violet-300">
              <Brain className="h-4 w-4" /> Notă Clinică generată de AI — pentru Psihiatru
            </CardTitle>
            <CardDescription className="text-xs">
              Revizuiți și ajustați înainte de a folosi. Printați sau copiați pentru a înmâna pacientului.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border bg-background p-3 text-sm leading-relaxed resize-none focus-visible:ring-1"
              rows={6}
              defaultValue={exportText}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(exportText)}>
                Copiază text
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExportText(null)}>Închide</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{editId ? "Editează Medicament" : "Medicament Nou"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Denumire Medicament *</Label>
                <Input value={form.medication_name}
                  onChange={(e) => setForm((f) => ({ ...f, medication_name: e.target.value }))}
                  placeholder="ex: Sertralină" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dozaj</Label>
                <Input value={form.dosage}
                  onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                  placeholder="ex: 50mg/zi" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Începerii</Label>
                <Input type="date" value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Opririi (gol = activ)</Label>
                <Input type="date" value={form.end_date ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Medic Prescriptor</Label>
                <Input value={form.prescribing_doctor}
                  onChange={(e) => setForm((f) => ({ ...f, prescribing_doctor: e.target.value }))}
                  placeholder="ex: Dr. Andrei Ionescu — Psihiatrie" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Observații Efecte Secundare</Label>
                <textarea
                  value={form.side_effect_notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, side_effect_notes: e.target.value || null }))}
                  placeholder="Ce raportează clientul..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Salvează</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Anulează</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active meds list */}
      {active.map((m) => (
        <MedRow key={m.id} m={m} onEdit={openEdit} onStop={handleStop} onDelete={handleDelete} />
      ))}

      {/* Inactive/stopped */}
      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Medicație oprită</p>
          {inactive.map((m) => (
            <MedRow key={m.id} m={m} onEdit={openEdit} onStop={handleStop} onDelete={handleDelete} stopped />
          ))}
        </div>
      )}

      {meds.length === 0 && !showForm && (
        <p className="text-sm text-center text-muted-foreground py-4">Nicio medicație înregistrată.</p>
      )}
    </div>
  );
}

function MedRow({ m, stopped, onEdit, onStop, onDelete }: {
  m: MockMedication;
  stopped?: boolean;
  onEdit: (m: MockMedication) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-3 group transition-colors hover:bg-muted/30 ${stopped ? "opacity-60" : ""}`}>
      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${stopped ? "bg-muted-foreground" : "bg-violet-500"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{m.medication_name}</p>
          {m.dosage && <Badge variant="outline" className="text-xs font-normal">{m.dosage}</Badge>}
          {!stopped && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-medium">Activ</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {m.prescribing_doctor}
          {" · "}
          {m.start_date}
          {m.end_date ? ` → ${m.end_date}` : " → prezent"}
        </p>
        {m.side_effect_notes && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">{m.side_effect_notes}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(m)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {!stopped && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => onStop(m.id)}
            title="Marchează ca oprită">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => onDelete(m.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
