export const runtime = "edge";

import { NextResponse } from "next/server";
import {
  ExpenseImportPayloadSchema,
  normalizeImportedExpense,
} from "@/lib/imports/smartbill";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const parsed = ExpenseImportPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { expenses } = parsed.data;

    const mappedExpenses = expenses.map((expense) => {
      const normalizedExpense = normalizeImportedExpense(expense);
      return {
      therapist_id: authData.user.id,
      document_number: normalizedExpense.number || "N/A",
      supplier_name: normalizedExpense.supplier || "Necunoscut",
      description: `Import SmartBill: ${normalizedExpense.supplier || ""}`,
      category: normalizedExpense.category,
      amount: normalizedExpense.amount,
      expense_date: normalizedExpense.expenseDateIso,
      created_at: new Date().toISOString(),
    };
    });

    const { data, error } = await supabase
      .from("cabinet_expenses")
      .insert(mappedExpenses)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length 
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import error" },
      { status: 500 },
    );
  }
}
