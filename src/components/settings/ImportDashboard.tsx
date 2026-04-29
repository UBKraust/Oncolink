"use client";

import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  History,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ImportedExpense, ImportedInvoice } from "@/lib/imports/smartbill";
import { SetupBanner } from "@/components/app/page-shell";

type ImportType = "invoices" | "expenses";
type CsvRow = Record<string, string | undefined>;

interface ImportStats {
  total: number;
  processed: number;
  status: "idle" | "parsing" | "uploading" | "success" | "error";
  errorMsg?: string;
}

export function ImportDashboard() {
  const [invoiceStats, setInvoiceStats] = useState<ImportStats>({ total: 0, processed: 0, status: "idle" });
  const [expenseStats, setExpenseStats] = useState<ImportStats>({ total: 0, processed: 0, status: "idle" });

  const resetStats = (type: ImportType) => {
    const setStats = type === "invoices" ? setInvoiceStats : setExpenseStats;
    setStats({ total: 0, processed: 0, status: "idle" });
  };

  const processCSV = async (file: File, type: ImportType) => {
    const setStats = type === "invoices" ? setInvoiceStats : setExpenseStats;
    setStats({ total: 0, processed: 0, status: "parsing" });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as CsvRow[];
        
        // Filter out summary rows (SmartBill often has "Total general" at the bottom)
        const filteredData = rawData.filter((row) => {
          if (type === "invoices") {
            return row.Serie || row.Numar || row.Client;
          }
          return row.Serie || row.Numar || row.Furnizor || row["Numar Document"];
        });

        if (filteredData.length === 0) {
          setStats({ total: 0, processed: 0, status: "error", errorMsg: "Fișierul pare gol sau are format invalid." });
          return;
        }

        setStats({ total: filteredData.length, processed: 0, status: "uploading" });

        try {
          // Normalize data structure for our API
          const payload: ImportedInvoice[] | ImportedExpense[] = type === "invoices" 
            ? filteredData.map((row) => ({
                series: row.Serie || "",
                number: row.Numar || "",
                date: row.Data || "",
                client_name: row.Client || "",
                total: row.Total || row["Valoare cu TVA"] || row["Suma Totala"] || "0",
                status: row.Status || "EMISĂ"
              }))
            : filteredData.map((row) => ({
                number: row.Numar || row["Numar Document"] || "",
                date: row.Data || "",
                supplier: row.Furnizor || "",
                total: row.Total || row["Valoare cu TVA"] || "0",
                category: "ALTE" // Default for import
              }));

          const endpoint = type === "invoices" ? "/api/import/invoices" : "/api/import/expenses";
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [type]: payload })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Eroare la import server.");
          }

          setStats(prev => ({ ...prev, status: "success", processed: prev.total }));
        } catch (err) {
          setStats(prev => ({
            ...prev,
            status: "error",
            errorMsg: err instanceof Error ? err.message : "Eroare necunoscută.",
          }));
        }
      },
      error: (err) => {
        setStats({ total: 0, processed: 0, status: "error", errorMsg: `Eroare citire CSV: ${err.message}` });
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ── IMPORT FACTURI (VENITURI) ────────────────────────────────── */}
      <ImportCard 
        title="Import Facturi Emise (Venituri)"
        description="Încarcă exportul SmartBill 'Vânzări' pentru a popula istoricul de încasări."
        stats={invoiceStats}
        onFileSelect={(file) => processCSV(file, "invoices")}
        onReset={() => resetStats("invoices")}
        columns={["Serie", "Număr", "Client", "Total", "Data"]}
      />

      {/* ── IMPORT CHELTUIELI (FURINZORI) ────────────────────────────── */}
      <ImportCard 
        title="Import Cheltuieli (Achiziții)"
        description="Încarcă exportul SmartBill 'Achiziții' pentru a vedea profitul net."
        stats={expenseStats}
        onFileSelect={(file) => processCSV(file, "expenses")}
        onReset={() => resetStats("expenses")}
        columns={["Serie", "Număr", "Furnizor", "Total", "Data"]}
      />
      
      <div className="md:col-span-2">
        <SetupBanner
          title="Sfaturi pentru un import reușit"
          description="Exportă din SmartBill în format CSV și verifică antetele uzuale înainte de încărcare. Aplicația încearcă să reconcilieze automat datele importate cu istoricul existent."
        />
      </div>

      <Card className="md:col-span-2 rounded-[1.75rem] border-border/60 bg-card shadow-sm">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Checklist înainte de upload:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Exportă fișierele din SmartBill folosind formatul <strong>CSV</strong>.</li>
              <li>Aplicația va încerca să identifice automat clienții existenți după nume.</li>
              <li>Sumele importate vor apărea instant în dashboard-ul de <strong>Monthly Review</strong>.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImportCard({ 
  title, 
  description, 
  stats, 
  onFileSelect, 
  onReset,
  columns 
}: { 
  title: string; 
  description: string; 
  stats: ImportStats;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  columns: string[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      onFileSelect(file);
    }
  };

  return (
    <Card className={cn(
      "rounded-[1.75rem] border-2 shadow-sm transition-all",
      stats.status === "success" ? "border-emerald-500 bg-emerald-50/10" : "border-border/60"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {stats.status === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <History className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.status === "idle" || stats.status === "error" ? (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all gap-3",
                dragOver ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border/60 hover:border-primary/50 hover:bg-muted/20"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Apasă sau trage fișierul aici</p>
                <p className="mt-1 text-xs text-muted-foreground">Format acceptat: .csv (SmartBill)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileSelect(f);
                }}
              />
            </div>
            
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
               <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coloane așteptate:</p>
               <div className="flex flex-wrap gap-2">
                 {columns.map(c => (
                   <span key={c} className="rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] font-bold text-foreground">
                     {c}
                   </span>
                 ))}
               </div>
            </div>

            {stats.status === "error" && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {stats.errorMsg}
              </div>
            )}
          </>
        ) : stats.status === "success" ? (
          <div className="space-y-3 py-8 text-center">
             <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
             </div>
             <div>
                <p className="text-sm font-bold italic text-foreground">Import reușit!</p>
                <p className="mt-1 text-xs text-muted-foreground">Au fost procesate cu succes {stats.total} înregistrări.</p>
             </div>
             <Button variant="outline" size="sm" onClick={onReset}>
                Încarcă alt fișier
             </Button>
          </div>
        ) : (
          <div className="space-y-6 py-12">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
              <span className="text-muted-foreground">
                {stats.status === "parsing" ? "Se analizează fișierul..." : "Se încarcă datele..."}
              </span>
              <span className="animate-pulse text-primary">{stats.total} rânduri identificate</span>
            </div>
            <Progress value={stats.status === "uploading" ? 100 : 50} className="h-2" />
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
