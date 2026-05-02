"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  GraduationCap,
  Laptop,
  Loader2,
  Plus,
  Receipt,
  Search,
  Shield,
  ShoppingCart,
  Trash2,
  X,
  Zap,
} from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Expense, ExpenseCategory } from "@/app/dashboard/expenses/actions";
import { createExpense, deleteExpense } from "@/app/dashboard/expenses/actions";
import { toast } from "@/components/ui/toast";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { StatCard as DashboardStatCard } from "@/components/dashboard/stat-card";

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
  { value: "CONSUMABILE", label: "Consumabile Cabinet", icon: ShoppingCart },
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const addDialogRef = useRef<HTMLDivElement>(null);
  const addCloseButtonRef = useRef<HTMLButtonElement>(null);

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

  useOverlayA11y({
    open: showAdd,
    onClose: () => setShowAdd(false),
    containerRef: addDialogRef,
    initialFocusRef: addCloseButtonRef,
  });

  function handleFilterChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
    router.push(`/dashboard/expenses?year=${newYear}&month=${newMonth}`);
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        toast.success("Cheltuiala a fost ștearsă.");
      } else {
        toast.error(result.error ?? "Nu am putut șterge cheltuiala.");
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
        <DashboardStatCard
          label={`Total cheltuieli ${MONTHS_RO[month - 1]}`}
          value={`${totalAmount.toLocaleString("ro-RO")} RON`}
          hint={`Din ${expenses.length} înregistrări`}
          icon={Receipt}
          tone="warning"
        />

        <Card className="md:col-span-2 rounded-[2rem] border-border/60 bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Filtrare Perioadă
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <Select
              defaultValue={String(month)}
              onChange={(e) => handleFilterChange(year, parseInt(e.target.value))}
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
              onChange={(e) => handleFilterChange(parseInt(e.target.value), month)}
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
      <SectionCard
        title="Cheltuieli înregistrate"
        description="Vizualizează, filtrează și gestionează costurile operaționale ale cabinetului."
        icon={Receipt}
      >
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="Nicio cheltuială găsită"
              description="Pentru perioada selectată nu există înregistrări sau filtrul de căutare nu găsește rezultate."
              icon={Receipt}
              action={{ label: "Adaugă cheltuială", onClick: () => setShowAdd(true) }}
            />
          ) : (
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
                {filteredExpenses.map((e) => {
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
                          onClick={() => setDeleteTargetId(e.id)}
                          disabled={isPending}
                          aria-label="Șterge cheltuiala"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <Card
            ref={addDialogRef}
            className="relative w-full max-w-lg rounded-[1.75rem] border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h2 id="expense-dialog-title" className="text-lg font-black tracking-tight">Adaugă cheltuială</h2>
              </div>
              <Button
                ref={addCloseButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => setShowAdd(false)}
                aria-label="Închide formularul de cheltuială"
              >
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
                    <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi această cheltuială?</AlertDialogTitle>
            <AlertDialogDescription>
              Acțiunea este ireversibilă. Înregistrarea va fi eliminată definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Șterge cheltuiala
            </AlertDialogAction>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
