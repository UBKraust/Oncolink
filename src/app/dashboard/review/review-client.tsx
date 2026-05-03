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
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthlyReview } from "@/app/api/analytics/monthly-review/route";
import {
  DashboardPage,
  EmptyState,
  MetricCard,
  PageHeader,
  SectionCard,
  SetupBanner,
} from "@/components/app/page-shell";

const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];

const fmt = (n: number) => n.toLocaleString("ro-RO", { maximumFractionDigits: 0 });

interface MonthlyReviewClientPageProps {
  practiceLabel: string;
}

export function MonthlyReviewClientPage({ practiceLabel }: MonthlyReviewClientPageProps) {
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

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
    <DashboardPage className="max-w-5xl pb-14">
      <PageHeader
        title="Sumar lunar cabinet"
        description="Raport executiv pentru activitatea clinică, sănătatea financiară și conformitatea lunii selectate."
        action={<div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm">
            {MONTHS_RO.map((l,i) => <option key={i+1} value={i+1}>{l}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm">
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
        </div>}
      />

      {data?.setupRequired ? (
        <SetupBanner description="Sumarul lunar folosește acum doar date reale. Configurează Supabase pentru a calcula indicatorii clinicii." />
      ) : null}

      {data && (
        <div ref={reportRef} className="space-y-5 bg-background">
          <div className="text-xs text-muted-foreground font-mono">
            Cabinet Psihoterapie · {MONTHS_RO[data.month-1]} {data.year}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Clock} label="Ore lucrate" value={`${data.totalHours}h`}
              sub={`${data.totalSessions} ședințe`} accent="neutral"
              hint={data.totalHours > 80 ? "⚠ Risc burnout — peste 80h/lună" : undefined} />
            <KpiCard icon={Users} label="Clienți unici" value={String(data.uniqueClients)}
              sub={`~${data.avgSessionsPerClient} șed/client`} accent="info" />
            <KpiCard icon={UserX} label="Rată anulări" value={`${data.noShowRate}%`}
              sub={`${data.cancelledSessions} anulate`}
              accent={data.noShowRate > 30 ? "danger" : data.noShowRate > 15 ? "warning" : "success"}
              hint={data.noShowRate > 30 ? "⚠ Rată mare — consideră politică de anulare" : undefined} />
            <KpiCard icon={Banknote} label="Venit mediu/șed." value={`${fmt(data.avgRevenuePerSession)} RON`}
              sub="per ședință" accent="info" />
            <KpiCard icon={TrendingUp} label="Profit Net" value={`${fmt(data.netProfit)} RON`}
              sub="Venit efectiv - Cheltuieli" accent="success"
              hint={data.netProfit < 0 ? "⚠ Profit negativ luna aceasta" : undefined} />
          </div>

          <SectionCard
            title="Sănătate financiară"
            description="Venituri, cheltuieli și rată de încasare pentru luna selectată."
            icon={Wallet}
          >
            <CardContent className="space-y-3 pt-0">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{fmt(data.totalRevenue)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Total Facturat</p>
                </div>
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{fmt(data.collectedRevenue)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Venit Încasat (Brut)</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{fmt(data.totalExpenses)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Cheltuieli</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-center">
                  <p className="text-xl font-bold text-primary">{fmt(data.netProfit)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter font-bold">Profit Net</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Rată încasare</span><span className="font-semibold">{collectionRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${collectionRate}%` }} />
                </div>
              </div>
            </CardContent>
          </SectionCard>

          {data.weeklyBreakdown.length > 0 && (
            <SectionCard
              title="Distribuție ședințe și venituri / săptămână"
              description="Compară încărcarea clinică cu venitul generat în cursul lunii."
              icon={TrendingUp}
            >
              <CardContent className="pt-0">
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
                    <Bar yAxisId="left" dataKey="sessions" fill="#0f766e" radius={[4,4,0,0]} name="Ședințe" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Venit" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </SectionCard>
          )}

          {data.alerts.length > 0 && (
            <SectionCard
              title="Alerte conformitate și acțiuni necesare"
              description="Rezolvați acestea înainte de închiderea lunii."
              icon={AlertTriangle}
            >
              <CardContent className="space-y-2 pt-0">
                {data.alerts.map(alert => (
                  <div key={alert.id}
                    className={cn("flex items-center gap-3 rounded-2xl border px-3 py-3",
                      alert.severity === "CRITICAL"
                        ? "border-destructive/20 bg-destructive/5"
                        : "border-amber-200 bg-amber-50/60 dark:bg-amber-950/20"
                    )}>
                    {alert.severity === "CRITICAL"
                      ? <ShieldX className="h-4 w-4 text-destructive shrink-0" />
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
            </SectionCard>
          )}

          {data.alerts.length === 0 && (
            <div className="flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Fără alerte de conformitate luna aceasta. Cabinet în regulă. ✓
            </div>
          )}

          <SectionCard
            title="Sinteză AI — Raport executiv"
            description="Analiză narativă generată local de Gemma 2 (Ollama). Nu include date sensibile."
            icon={BrainCircuit}
          >
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline"
                  onClick={generateAiInsight} disabled={aiLoading}
                  className="h-7 gap-1.5 text-xs">
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                  {aiSummary ? "Regenerează" : "Generează"}
                </Button>
              </div>
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
          </SectionCard>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Generat de Ce`ai Pățit? ERP · {practiceLabel} · {new Date().toLocaleDateString("ro-RO")}
          </p>
        </div>
      )}

      {!data && !loading ? (
        <EmptyState
          title="Sumarul lunii nu a fost generat"
          description="Alege perioada dorită și apasă «Calculează» pentru a obține raportul executiv."
          icon={CalendarRange}
        />
      ) : null}
    </DashboardPage>
  );
}

function KpiCard({ icon, label, value, sub, accent, hint }: {
  icon: typeof Clock; label: string; value: string;
  sub?: string; hint?: string;
  accent: "neutral"|"info"|"success"|"warning"|"danger";
}) {
  const styles = {
    neutral: "bg-muted text-foreground",
    info: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <MetricCard
      icon={icon}
      label={label}
      value={value}
      iconClassName={styles[accent]}
      trend={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {sub ? <span>{sub}</span> : null}
          {hint ? <Badge variant="warning">{hint}</Badge> : null}
        </div>
      }
    />
  );
}
