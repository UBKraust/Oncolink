"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  History,
  Laptop,
  Loader2,
  Plus,
  Receipt,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/app/dashboard/expenses/actions";
import { createExpense, deleteExpense } from "@/app/dashboard/expenses/actions";

const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "CHIRIE", label: "Chirie Spațiu", icon: Building2 },
  { value: "UTILITATI", label: "Utilități & Facturi", icon: Zap },
  { value: "CONTABILITATE", label: "Contabilitate", icon: Calculator },
  { value: "CURSURI", label: "Formare & Cursuri", icon: GraduationCap },
  { value: "ASIGURARE", label: "Asigurare Malpraxis", icon: Shield },
  { value: "ECHIPAMENTE", label: "Echipamente & IT", icon: Laptop },
  { value: "ALTE", label: "Alte cheltuieli", icon: Receipt },
];

const categoryMeta = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<ExpenseCategory, (typeof CATEGORIES)[0]>;

interface ExpensesClientProps {
  initialExpenses: Expense[];
  initialYear: number;
  initialMonth: number;
}

export function ExpensesClient({
  initialExpenses,
  initialYear,
  initialMonth,
}: ExpensesClientProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    const s = searchTerm.toLowerCase();
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(s) ||
        categoryMeta[e.category].label.toLowerCase().includes(s),
    );
  }, [expenses, searchTerm]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  function handleFilterChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
    router.push(`/dashboard/expenses?year=${newYear}&month=${newMonth}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Ștergi această cheltuială?")) return;
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setUploadError(null);

    startTransition(async () => {
      const result = await createExpense(fd);
      if (result.ok && result.expense) {
        setExpenses((prev) => [result.expense!, ...prev]);
        setUploadSuccess(true);
        setTimeout(() => {
          setShowAdd(false);
          setUploadSuccess(false);
        }, 1500);
      } else {
        setUploadError(result.error ?? "Eroare necunoscută.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters & Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Cheltuieli {MONTHS_RO[month - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString("ro-RO")} RON</div>
            <p className="text-xs text-muted-foreground mt-1">
              Din {expenses.length} înregistrări
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filtrare Perioadă
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Select
              defaultValue={String(month)}
              onValueChange={(v) => handleFilterChange(year, parseInt(v))}
              className="w-40"
            >
              {MONTHS_RO.map((m, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {m}
                </option>
              ))}
            </Select>
            <Select
              defaultValue={String(year)}
              onValueChange={(v) => handleFilterChange(parseInt(v), month)}
              className="w-28"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după descriere..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAdd(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adaugă
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dată</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Descriere</TableHead>
              <TableHead className="text-right">Sumă</TableHead>
              <TableHead className="text-center w-24">Bon/Factură</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nicio cheltuială găsită pentru această perioadă.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((e) => {
                const meta = categoryMeta[e.category];
                const Icon = meta.icon;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {new Date(e.expense_date).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm">{meta.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                    <TableCell className="text-right font-bold">
                      {e.amount.toLocaleString("ro-RO")} RON
                    </TableCell>
                    <TableCell className="text-center">
                      {e.receipt_url ? (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <a href={e.receipt_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-primary" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(e.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <Card className="relative w-full max-w-lg border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Adaugă Cheltuială</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-6">
              {uploadSuccess ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center text-emerald-600">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-semibold">Cheltuială salvată!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {uploadError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categorie</Label>
                      <Select id="category" name="category" required defaultValue="">
                        <option value="" disabled>— Selectează —</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expense_date">Data Cheltuielii</Label>
                      <Input
                        id="expense_date"
                        name="expense_date"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description">Descriere / Furnizor</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="ex: Factură Digi internet sediu"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Sumă (RON)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">Bon / Factură (PDF/Imagine)</Label>
                      <Input id="receipt" name="receipt" type="file" accept=".pdf,image/*" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAdd(false)}
                      disabled={isPending}
                    >
                      Anulează
                    </Button>
                    <Button type="submit" disabled={isPending} className="px-8">
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        "Salvează"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
