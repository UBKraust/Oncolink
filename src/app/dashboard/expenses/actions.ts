"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMockExpenses, addMockExpense, removeMockExpense } from "@/lib/mock/expenses";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";

export type ExpenseCategory =
  | "CHIRIE"
  | "UTILITATI"
  | "CONTABILITATE"
  | "CURSURI"
  | "ASIGURARE"
  | "ECHIPAMENTE"
  | "CONSUMABILE"
  | "ALTE";

export interface Expense {
  id: string;
  therapist_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  receipt_path: string | null;
  created_at: string;
}

export interface ExpenseActionResult {
  ok: boolean;
  error?: string;
  expense?: Expense;
}

export async function listExpenses(year: number, month: number): Promise<Expense[]> {
  if (!isSupabaseConfigured()) return getMockExpenses(year, month);

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("cabinet_expenses")
    .select("*")
    .eq("therapist_id", authData.user.id)
    .gte("expense_date", startDate)
    .lt("expense_date", endDate)
    .order("expense_date", { ascending: false });

  if (error) return [];

  const expenses = (data ?? []) as Expense[];
  return Promise.all(
    expenses.map(async (expense) => ({
      ...expense,
      receipt_url:
        (await createSignedObjectUrl(
          supabase,
          "therapist-vault",
          expense.receipt_path,
        )) ?? expense.receipt_url,
    })),
  );
}

export async function createExpense(formData: FormData): Promise<ExpenseActionResult> {
  if (!isSupabaseConfigured()) {
    const category = formData.get("category") as ExpenseCategory;
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const expenseDate = formData.get("expense_date") as string;
    if (!category || !description || isNaN(amount) || !expenseDate)
      return { ok: false, error: "Câmpuri obligatorii lipsă." };
    const expense: Expense = {
      id: `exp-demo-${Date.now()}`,
      therapist_id: "mock-therapist",
      category, description, amount, expense_date: expenseDate,
      receipt_url: null, receipt_path: null,
      created_at: new Date().toISOString(),
    };
    addMockExpense(expense);
    return { ok: true, expense };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: "Neautentificat." };

  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amountStr = formData.get("amount") as string;
  const expenseDate = formData.get("expense_date") as string;
  const file = formData.get("receipt") as File | null;

  if (!category || !description || !amountStr || !expenseDate) {
    return { ok: false, error: "Toate câmpurile (categorie, descriere, sumă, dată) sunt obligatorii." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { ok: false, error: "Suma trebuie să fie un număr pozitiv." };
  }

  let receiptUrl: string | null = null;
  let receiptPath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: "Fișierul depășește limita de 10 MB." };
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
    receiptPath = `expenses/${authData.user.id}/${Date.now()}_${safeName}`;

    const { error: storageError } = await supabase.storage
      .from("therapist-vault")
      .upload(receiptPath, file, {
        contentType: file.type || `application/${ext}`,
        upsert: false,
      });

    if (storageError) return { ok: false, error: `Eroare upload: ${storageError.message}` };

    receiptUrl = await createSignedObjectUrl(
      supabase,
      "therapist-vault",
      receiptPath,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: dbError } = await (supabase as any)
    .from("cabinet_expenses")
    .insert({
      therapist_id: authData.user.id,
      category,
      description,
      amount,
      expense_date: expenseDate,
      receipt_url: receiptUrl,
      receipt_path: receiptPath,
    })
    .select("*")
    .single();

  if (dbError) {
    if (receiptPath) {
      await supabase.storage.from("therapist-vault").remove([receiptPath]);
    }
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/review");
  return { ok: true, expense: inserted as Expense };
}

export async function deleteExpense(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    removeMockExpense(id);
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: "Neautentificat." };

  // Fetch to get receipt_path before deletion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc } = await (supabase as any)
    .from("cabinet_expenses")
    .select("receipt_path")
    .eq("id", id)
    .eq("therapist_id", authData.user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("cabinet_expenses")
    .delete()
    .eq("id", id)
    .eq("therapist_id", authData.user.id);

  if (error) return { ok: false, error: error.message };

  if (doc?.receipt_path) {
    await supabase.storage
      .from("therapist-vault")
      .remove([doc.receipt_path])
      .catch(() => {});
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/review");
  return { ok: true };
}
