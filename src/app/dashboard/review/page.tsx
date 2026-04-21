"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Clock, Wallet, UserX, Users, TrendingUp, AlertTriangle,
  ShieldX, FileDown, Loader2, BrainCircuit, RotateCcw,
  CheckCircle2, CalendarRange, Banknote
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MonthlyReview } from "@/app/api/analytics/monthly-review/route";

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];

const fmt = (n: number) => n.toLocaleString("ro-RO", { maximumFractionDigits: 0 });

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MonthlyReviewPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<MonthlyReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary,  setAiSummary]  = useState<string | null>(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch(`/api/analytics/monthly-review?year=${year}&month=${month}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // ── AI Narrative ────────────────────────────────────────────────────────────
  async function generateAiInsight() {
    if (!data) return;
    setAiLoading(true);
    const prompt = `Ești un consultant specializat în cabinete de psihoterapie. Analizează datele lunare ale acestui cabinet și scrie un rezumat executiv de 4-5 propoziții în română, profesional și empatic, care să evidențieze: (1) efortul clinic, (2) sănătatea financiară, (3) un sfat practic pentru luna viitoare.

Date ${MONTHS_RO[data.month-1]} ${data.year}:
- ${data.totalSessions} ședințe finalizate, ${data.totalHours}h lucrate cu ${data.uniqueClients} clienți
- Rata anulări: ${data.noShowRate}%
- Încasat: ${fmt(data.collectedRevenue)} RON din ${fmt(data.totalRevenue)} RON total
- Cheltuieli: ${fmt(data.totalExpenses)} RON
- Profit Net: ${fmt(data.netProfit)} RON
- Restanțe: ${fmt(data.outstandingRevenue)} RON
- Venit mediu/ședință: ${fmt(data.avgRevenuePerSession)} RON
- Alerte conformitate: ${data.alerts.length} item-uri

Scrie direct rezumatul, fără titlu.`;

    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";
    const model     = process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct";
    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model, prompt, stream:false }),
        signal: AbortSignal.timeout(90_000),
      });
      const json = await res.json() as { response: string };
      setAiSummary(json.response.trim());
    } catch (err) {
      setAiSummary(`⚠ Ollama indisponibil: ${err instanceof Error ? err.message : "eroare necunoscută"}`);
    } finally { setAiLoading(false); }
  }

  // ── PDF Export ──────────────────────────────────────────────────────────────
  async function exportPdf() {
    if (!reportRef.current || !data) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(reportRef.current, { scale: 1.8, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      const pageH = 297;
      let position = 0;
      let remaining = imgH;

      while (remaining > 0) {
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, position ? -position : 0, imgW, imgH);
        remaining -= pageH;
        position  += pageH;
        if (remaining > 0) pdf.addPage();
      }

      pdf.save(`Sumar_Cabinet_${data.year}_${String(data.month).padStart(2,"0")}.pdf`);
    } finally { setPdfLoading(false); }
  }

  const collectionRate = data ? Math.round(data.collectedRevenue / (data.totalRevenue || 1) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-14">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            Sumar Lunar Cabinet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Raport executiv — activitate clinică, financiară și conformitate juridică.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
            {MONTHS_RO.map((l,i) => <option key={i+1} value={i+1}>{l}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
            {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <Button onClick={load} disabled={loading} variant="outline" className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Calculează
          </Button>
          <Button onClick={exportPdf} disabled={pdfLoading || !data} variant="outline" className="gap-1.5">
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      {!data && !loading && (
        <p className="text-center text-muted-foreground py-12">Apasă &quot;Calculează&quot; pentru a genera sumarul lunii.</p>
      )}

      {/* Printable report body */}
      {data && (
        <div ref={reportRef} className="space-y-5 bg-background">

          {/* Report title (visible in PDF) */}
          <div className="text-xs text-muted-foreground font-mono">
            Cabinet Psihoterapie · {MONTHS_RO[data.month-1]} {data.year}
            {data.isDemo && <span className="ml-2 text-amber-600">[date demonstrație]</span>}
          </div>

          {/* ── KPI Row 1 — Clinical ──────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={<Clock className="h-5 w-5" />} label="Ore lucrate" value={`${data.totalHours}h`}
              sub={`${data.totalSessions} ședințe`} accent="violet"
              hint={data.totalHours > 80 ? "⚠ Risc burnout — peste 80h/lună" : undefined} />
            <KpiCard icon={<Users className="h-5 w-5" />} label="Clienți unici" value={String(data.uniqueClients)}
              sub={`~${data.avgSessionsPerClient} șed/client`} accent="blue" />
            <KpiCard icon={<UserX className="h-5 w-5" />} label="Rată anulări" value={`${data.noShowRate}%`}
              sub={`${data.cancelledSessions} anulate`}
              accent={data.noShowRate > 30 ? "rose" : data.noShowRate > 15 ? "amber" : "emerald"}
              hint={data.noShowRate > 30 ? "⚠ Rată mare — consideră politică de anulare" : undefined} />
            <KpiCard icon={<Banknote className="h-5 w-5" />} label="Venit mediu/șed." value={`${fmt(data.avgRevenuePerSession)} RON`}
              sub="per ședință" accent="teal" />
            <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Profit Net" value={`${fmt(data.netProfit)} RON`}
              sub="Venit efectiv - Cheltuieli" accent="emerald"
              hint={data.netProfit < 0 ? "⚠ Profit negativ luna aceasta" : undefined} />
          </div>

          {/* ── KPI Row 2 — Financial ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" /> Sănătate Financiară
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{fmt(data.totalRevenue)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Total Facturat</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(data.collectedRevenue)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Venit Încasat (Brut)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{fmt(data.totalExpenses)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Cheltuieli</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xl font-bold text-primary">{fmt(data.netProfit)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter font-bold">Profit Net</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Rată încasare</span><span className="font-semibold">{collectionRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${collectionRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Chart — Weekly breakdown ──────────────────────────────────── */}
          {data.weeklyBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Distribuție Ședințe & Venituri / Săptămână
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.weeklyBreakdown} margin={{ top:4, right:8, left:-16, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize:12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize:11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} />
                    <Tooltip
                      formatter={(val: number, name: string) =>
                        name === "revenue" ? [`${fmt(val)} RON`, "Venit"] : [val, "Ședințe"]}
                      contentStyle={{ borderRadius:"8px", fontSize:"12px" }}
                    />
                    <Bar yAxisId="left" dataKey="sessions" fill="#8b5cf6" radius={[4,4,0,0]} name="Ședințe" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Venit" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Compliance Alerts ─────────────────────────────────────────── */}
          {data.alerts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Alerte Conformitate & Acțiuni Necesare
                </CardTitle>
                <CardDescription className="text-xs">Rezolvați acestea înainte de închiderea lunii.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.map(alert => (
                  <div key={alert.id}
                    className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5",
                      alert.severity === "CRITICAL"
                        ? "border-rose-200 bg-rose-50/60 dark:bg-rose-950/20"
                        : "border-amber-200 bg-amber-50/60 dark:bg-amber-950/20"
                    )}>
                    {alert.severity === "CRITICAL"
                      ? <ShieldX className="h-4 w-4 text-rose-600 shrink-0" />
                      : <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
                    <p className="text-sm flex-1">
                      <strong>{alert.count}</strong> {alert.message}
                    </p>
                    {alert.clientIds[0] && (
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0">
                        <Link href={`/dashboard/clients/${alert.clientIds[0]}`}>
                          Rezolvă →
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.alerts.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Fără alerte de conformitate luna aceasta. Cabinet în regulă. ✓
            </div>
          )}

          {/* ── AI Narrative ─────────────────────────────────────────────── */}
          <Card className="border-violet-200 dark:border-violet-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-violet-700 dark:text-violet-400">
                  <BrainCircuit className="h-4 w-4" /> Sinteză AI — Raport Executiv
                </CardTitle>
                <Button size="sm" variant="outline"
                  onClick={generateAiInsight} disabled={aiLoading}
                  className="h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 gap-1.5">
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                  {aiSummary ? "Regenerează" : "Generează"}
                </Button>
              </div>
              <CardDescription className="text-xs">
                Analiză narativă generată local de Gemma 2 (Ollama). Nu include date sensibile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiSummary ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{aiSummary}</p>
                  <Button variant="ghost" size="sm" className="text-xs h-7"
                    onClick={() => navigator.clipboard.writeText(aiSummary)}>
                    Copiază text
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Apasă &quot;Generează&quot; pentru a obține o sinteză narativă personalizată a activității lunii.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Footer (PDF only) */}
          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Generat de Oncolink ERP · Cabinet Psihoterapie Ioana Cosmina Terente PFA ·{" "}
            {new Date().toLocaleDateString("ro-RO")}
          </p>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent, hint }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; hint?: string;
  accent: "violet"|"blue"|"emerald"|"amber"|"rose"|"teal";
}) {
  const styles = {
    violet:  { wrap:"border-violet-100 dark:border-violet-900/40",  icon:"bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",  val:"text-violet-700 dark:text-violet-300" },
    blue:    { wrap:"border-blue-100 dark:border-blue-900/40",    icon:"bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",      val:"text-blue-700 dark:text-blue-300" },
    emerald: { wrap:"border-emerald-100 dark:border-emerald-900/40", icon:"bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400", val:"text-emerald-700 dark:text-emerald-300" },
    amber:   { wrap:"border-amber-100 dark:border-amber-900/40",  icon:"bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",    val:"text-amber-700 dark:text-amber-300" },
    rose:    { wrap:"border-rose-100 dark:border-rose-900/40",    icon:"bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",       val:"text-rose-700 dark:text-rose-300" },
    teal:    { wrap:"border-teal-100 dark:border-teal-900/40",    icon:"bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400",       val:"text-teal-700 dark:text-teal-300" },
  };
  const s = styles[accent];
  return (
    <Card className={cn("border", s.wrap)}>
      <CardContent className="p-4">
        <div className={cn("inline-flex items-center justify-center rounded-lg p-2 mb-3", s.icon)}>{icon}</div>
        <p className={cn("text-2xl font-bold tracking-tight", s.val)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        {hint && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">{hint}</p>}
      </CardContent>
    </Card>
  );
}
