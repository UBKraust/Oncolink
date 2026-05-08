"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileEdit, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { upsertTherapyReport, finalizeTherapyReport } from "@/app/dashboard/forms/forms-actions";
import type { ReportType } from "@/app/dashboard/forms/forms-actions";
import { generatePsychologicalReport } from "@/lib/pdf/templates";

export interface ReportContent {
  client_name: string;
  birth_date: string;
  referral_source: string;
  evaluation_period: string;
  referral_reason: string;
  presenting_problem: string;
  personal_history: string;
  family_history: string;
  medical_history: string;
  methods_used: string;
  instruments_applied: string;
  results_cognitive: string;
  results_emotional: string;
  results_behavioral: string;
  results_interpersonal: string;
  psychological_profile: string;
  conclusions: string;
  diagnostic_formulation: string;
  recommendations: string;
  follow_up: string;
}

const EMPTY: ReportContent = {
  client_name: "", birth_date: "", referral_source: "", evaluation_period: "",
  referral_reason: "", presenting_problem: "",
  personal_history: "", family_history: "", medical_history: "",
  methods_used: "", instruments_applied: "",
  results_cognitive: "", results_emotional: "", results_behavioral: "", results_interpersonal: "",
  psychological_profile: "",
  conclusions: "", diagnostic_formulation: "",
  recommendations: "", follow_up: "",
};

interface SectionDef {
  title: string;
  fields: { key: keyof ReportContent; label: string; placeholder: string; rows: number; type?: "input" }[];
}

const SECTIONS: SectionDef[] = [
  {
    title: "1. Date de identificare",
    fields: [
      { key: "client_name", label: "Nume client", placeholder: "Prenume Nume", rows: 1, type: "input" },
      { key: "birth_date", label: "Data nașterii", placeholder: "ex: 15.03.1990", rows: 1, type: "input" },
      { key: "referral_source", label: "Sursă de trimitere", placeholder: "Medic de familie, auto-referire, angajator...", rows: 1, type: "input" },
      { key: "evaluation_period", label: "Perioada evaluării", placeholder: "ex: 01.03.2026 – 20.03.2026", rows: 1, type: "input" },
    ],
  },
  {
    title: "2. Motivul evaluării",
    fields: [
      { key: "referral_reason", label: "Motivul trimiterii", placeholder: "Context și motivul pentru care s-a solicitat evaluarea...", rows: 3 },
      { key: "presenting_problem", label: "Problema prezentată", placeholder: "Simptome, acuze, durata, evoluție...", rows: 4 },
    ],
  },
  {
    title: "3. Antecedente",
    fields: [
      { key: "personal_history", label: "Antecedente personale", placeholder: "Dezvoltare, educație, evenimente semnificative de viață...", rows: 4 },
      { key: "family_history", label: "Antecedente familiale", placeholder: "Structura familiei, relații, boli psihice în familie...", rows: 3 },
      { key: "medical_history", label: "Antecedente medicale relevante", placeholder: "Diagnostice, tratamente, intervenții chirurgicale...", rows: 2 },
    ],
  },
  {
    title: "4. Metodologie",
    fields: [
      { key: "methods_used", label: "Metode utilizate", placeholder: "Observație clinică, interviu semi-structurat, teste proiective...", rows: 3 },
      { key: "instruments_applied", label: "Instrumente aplicate", placeholder: "MMPI-2, BDI-II, STAI, SCL-90, WAIS-IV... (cu scoruri brute și T-scoruri)", rows: 4 },
    ],
  },
  {
    title: "5. Rezultate și interpretare",
    fields: [
      { key: "results_cognitive", label: "Domeniu cognitiv", placeholder: "Capacitate intelectuală, atenție, memorie, funcții executive...", rows: 4 },
      { key: "results_emotional", label: "Domeniu emoțional", placeholder: "Dispoziție, afect, reglare emoțională, anxietate, depresie...", rows: 4 },
      { key: "results_behavioral", label: "Domeniu comportamental", placeholder: "Comportamente observate, pattern-uri, impulsivitate...", rows: 3 },
      { key: "results_interpersonal", label: "Domeniu interpersonal", placeholder: "Relații sociale, atașament, comunicare, conflicte...", rows: 3 },
    ],
  },
  {
    title: "6. Profil psihologic",
    fields: [
      { key: "psychological_profile", label: "Sinteză profil", placeholder: "Descriere integrativă a personalității și funcționării psihologice actuale...", rows: 6 },
    ],
  },
  {
    title: "7. Concluzii și diagnostic",
    fields: [
      { key: "conclusions", label: "Concluzii", placeholder: "Sinteza principalelor constatări ale evaluării...", rows: 4 },
      { key: "diagnostic_formulation", label: "Formulare diagnostică", placeholder: "ex: F32.1 Episod depresiv moderat (ICD-10) / 296.22 MDD, Single episode, moderate (DSM-5)...", rows: 3 },
    ],
  },
  {
    title: "8. Recomandări",
    fields: [
      { key: "recommendations", label: "Recomandări", placeholder: "Psihoterapie individuală, evaluare psihiatrică, intervenții specifice...", rows: 4 },
      { key: "follow_up", label: "Plan de urmărire", placeholder: "Frecvență, condiții de reevaluare, resurse de urgență...", rows: 3 },
    ],
  },
];

interface ClientOption {
  id: string;
  full_name: string | null;
}

interface ReportEditorProps {
  clients: ClientOption[];
  reportId?: string;
  initialContent?: Partial<ReportContent>;
  initialClientId?: string;
  initialReportType?: ReportType;
  initialTitle?: string;
  initialReportNumber?: string;
  initialStatus?: string;
  psychologistName?: string;
}

export function ReportEditor({
  clients,
  reportId,
  initialContent,
  initialClientId,
  initialReportType,
  initialTitle,
  initialReportNumber,
  initialStatus,
  psychologistName,
}: ReportEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<ReportContent>({ ...EMPTY, ...initialContent });
  const [reportType, setReportType] = useState<ReportType>(initialReportType ?? "ADULT");
  const [reportTitle, setReportTitle] = useState(initialTitle ?? "");
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [reportNumber, setReportNumber] = useState(initialReportNumber ?? "");
  const [status, setStatus] = useState(initialStatus ?? "DRAFT");
  const [savedId, setSavedId] = useState(reportId ?? null);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const [isPending, startTransition] = useTransition();

  const autoSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);
  autoSaveRef.current = async () => {
    if (!selectedClientId) return;
    const result = await upsertTherapyReport({
      id: savedId ?? undefined,
      clientId: selectedClientId,
      content,
      status: "DRAFT",
      reportType,
      title: reportTitle || undefined,
      reportNumber: reportNumber || undefined,
    });
    if ("error" in result) return;
    if (!savedId) {
      setSavedId(result.id);
      router.replace(`/dashboard/forms/report/${result.id}`);
    }
    setSaveIndicator("saved");
    setTimeout(() => setSaveIndicator("idle"), 2000);
  };

  useEffect(() => {
    if (!selectedClientId) return;
    setSaveIndicator("saving");
    const timer = setTimeout(() => { autoSaveRef.current?.(); }, 2000);
    return () => clearTimeout(timer);
  }, [content, selectedClientId, reportType, reportTitle]);

  function set(key: keyof ReportContent, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  function handleManualSave() {
    startTransition(async () => {
      if (!selectedClientId) { toast.error("Selectează un client."); return; }
      const result = await upsertTherapyReport({
        id: savedId ?? undefined,
        clientId: selectedClientId,
        content,
        status: "DRAFT",
        reportType,
        title: reportTitle || undefined,
        reportNumber: reportNumber || undefined,
      });
      if ("error" in result) { toast.error(result.error); return; }
      if (!savedId) {
        setSavedId(result.id);
        router.replace(`/dashboard/forms/report/${result.id}`);
      }
      setStatus("DRAFT");
      toast.success("Raport salvat.");
    });
  }

  function handleFinalize() {
    if (!savedId) { toast.error("Salvează mai întâi raportul."); return; }
    if (!reportNumber.trim()) { toast.error("Completează numărul raportului."); return; }
    startTransition(async () => {
      const { error } = await finalizeTherapyReport(savedId, reportNumber);
      if (error) { toast.error(error); return; }
      setStatus("FINAL");
      toast.success("Raport finalizat.");
    });
  }

  async function handleExportPdf() {
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    const result = await generatePsychologicalReport({
      reportNumber: reportNumber || undefined,
      date: new Date().toLocaleDateString("ro-RO"),
      reportType,
      psychologistName: psychologistName || undefined,
      clientName: content.client_name || selectedClient?.full_name || undefined,
      birthDate: content.birth_date || undefined,
      referralSource: content.referral_source || undefined,
      evaluationPeriod: content.evaluation_period || undefined,
      referralReason: content.referral_reason || undefined,
      presentingProblem: content.presenting_problem || undefined,
      personalHistory: content.personal_history || undefined,
      familyHistory: content.family_history || undefined,
      medicalHistory: content.medical_history || undefined,
      methodsUsed: content.methods_used || undefined,
      instrumentsApplied: content.instruments_applied || undefined,
      resultsCognitive: content.results_cognitive || undefined,
      resultsEmotional: content.results_emotional || undefined,
      resultsBehavioral: content.results_behavioral || undefined,
      resultsInterpersonal: content.results_interpersonal || undefined,
      psychologicalProfile: content.psychological_profile || undefined,
      conclusions: content.conclusions || undefined,
      diagnosticFormulation: content.diagnostic_formulation || undefined,
      recommendations: content.recommendations || undefined,
      followUp: content.follow_up || undefined,
    });
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileEdit className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black tracking-tight">Editor raport psihologic</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status === "FINAL"
                ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Finalizat</span>
                : saveIndicator === "saving"
                  ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Se salvează...</span>
                  : saveIndicator === "saved"
                    ? <span className="text-emerald-600 dark:text-emerald-400">Salvat automat</span>
                    : "Ciornă"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} type="button">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            {status !== "FINAL" && (
              <>
                <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isPending} type="button">
                  <Pencil className="h-4 w-4" />
                  Salvează
                </Button>
                <Button size="sm" onClick={handleFinalize} disabled={isPending} type="button">
                  <Check className="h-4 w-4" />
                  Finalizează
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Report meta fields */}
        <div className="px-6 py-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</Label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Selectează client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name ?? c.id}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tip raport</Label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ADULT">Adult</option>
              <option value="MINOR">Minor</option>
              <option value="B2B_WELLBEING">B2B Wellbeing</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nr. raport</Label>
            <Input
              value={reportNumber}
              onChange={(e) => setReportNumber(e.target.value)}
              placeholder="ex: RP-2026-001"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titlu (opțional)</Label>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Titlu personalizat..."
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((sec) => (
        <div key={sec.title} className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
          <div className="px-6 py-4 border-b border-border/40">
            <p className="text-sm font-black tracking-tight">{sec.title}</p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {sec.fields.map(({ key, label, placeholder, rows, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
                {type === "input" ? (
                  <Input
                    value={content[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="text-sm"
                    disabled={status === "FINAL"}
                  />
                ) : (
                  <Textarea
                    value={content[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className="resize-none text-sm"
                    disabled={status === "FINAL"}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bottom action bar */}
      {status !== "FINAL" && (
        <div className="flex justify-end gap-2 pb-4">
          <Button variant="outline" onClick={handleManualSave} disabled={isPending}>
            <Pencil className="h-4 w-4" />
            Salvează ciornă
          </Button>
          <Button onClick={handleFinalize} disabled={isPending}>
            <Check className="h-4 w-4" />
            Finalizează raport
          </Button>
        </div>
      )}

      {status === "FINAL" && (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Raport finalizat · Nr. {reportNumber}
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">FINAL</Badge>
        </div>
      )}
    </div>
  );
}
