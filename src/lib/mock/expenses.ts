import type { Expense, ExpenseCategory } from "@/app/dashboard/expenses/actions";

function splitmix32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

const rand = splitmix32(987654);

interface ExpenseDef {
  category: ExpenseCategory;
  description: string;
  amount: number;
}

const EXPENSE_TEMPLATES: ExpenseDef[] = [
  { category: "CHIRIE",         description: "Chirie spațiu cabinet — luna curentă",   amount: 1200 },
  { category: "UTILITATI",      description: "Energie electrică & internet",             amount:  180 },
  { category: "CONTABILITATE",  description: "Servicii contabilitate lunară",            amount:  250 },
  { category: "CURSURI",        description: "Curs supervizare ACT — semestrul I",       amount:  450 },
  { category: "ASIGURARE",      description: "Asigurare malpraxis anuală (cotă lunară)", amount:   90 },
  { category: "ECHIPAMENTE",    description: "Abonament software cabinet (ERP)",         amount:   79 },
  { category: "UTILITATI",      description: "Telefonie mobilă profesională",            amount:   55 },
  { category: "ALTE",           description: "Materiale birou & papetărie",              amount:   42 },
  { category: "CONSUMABILE",    description: "Consumabile medicale (mănuși, dezinfectant)", amount: 120 },
  { category: "CURSURI",        description: "Conferință PSIWORLD 2026 — taxă participare", amount: 320 },
  { category: "CHIRIE",         description: "Chirie spațiu clinică — seara",           amount:  400 },
  { category: "ECHIPAMENTE",    description: "Fotoliu terapie nou",                      amount:  890 },
  { category: "CONTABILITATE",  description: "Depunere declarație TVA trimestrială",    amount:   80 },
];

function makeDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateExpensesForMonth(year: number, month: number): Expense[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const dayLimit = isCurrentMonth ? now.getDate() : daysInMonth;

  // Pick 4-7 expenses per month deterministically
  const seed = year * 100 + month;
  const r = splitmix32(seed * 31337);
  const count = 4 + Math.floor(r() * 4);
  const picked = [...EXPENSE_TEMPLATES]
    .sort(() => r() - 0.5)
    .slice(0, count);

  return picked.map((tpl, i) => {
    const day = Math.min(dayLimit, 1 + Math.floor(r() * dayLimit));
    return {
      id: `exp-${year}-${month}-${i}`,
      therapist_id: "mock-therapist",
      category: tpl.category,
      description: tpl.description,
      amount: tpl.amount,
      expense_date: makeDate(year, month, day),
      receipt_url: null,
      receipt_path: null,
      created_at: makeDate(year, month, day) + "T10:00:00.000Z",
    };
  }).sort((a, b) => b.expense_date.localeCompare(a.expense_date));
}

// In-memory store for optimistic demo creates/deletes
let _mockOverrides: Expense[] | null = null;

export function getMockExpenses(year: number, month: number): Expense[] {
  const base = generateExpensesForMonth(year, month);
  if (!_mockOverrides) return base;
  const added = _mockOverrides.filter(
    (e) => e.expense_date.startsWith(`${year}-${String(month).padStart(2, "0")}`)
  );
  const deletedIds = new Set(
    (_mockOverrides as any[]).filter((e) => e._deleted).map((e) => e.id)
  );
  return [...base.filter((e) => !deletedIds.has(e.id)), ...added].sort(
    (a, b) => b.expense_date.localeCompare(a.expense_date)
  );
}

export function addMockExpense(expense: Expense) {
  if (!_mockOverrides) _mockOverrides = [];
  _mockOverrides.push(expense);
}

export function removeMockExpense(id: string) {
  if (!_mockOverrides) _mockOverrides = [];
  _mockOverrides.push({ id, _deleted: true } as any);
}

// Export a static snapshot for the current month (used by dashboard stats)
const now = new Date();
export const mockExpensesCurrentMonth = generateExpensesForMonth(now.getFullYear(), now.getMonth() + 1);
export const mockExpensesTotal = mockExpensesCurrentMonth.reduce((s, e) => s + e.amount, 0);
