export const runtime = "edge";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenses } = await req.json();
    if (!Array.isArray(expenses)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const mappedExpenses = expenses.map(exp => ({
      therapist_id: authData.user.id,
      document_number: exp.number || "N/A",
      supplier_name: exp.supplier || "Necunoscut",
      description: `Import SmartBill: ${exp.supplier || ""}`,
      category: exp.category || "ALTE",
      amount: parseFloat(exp.total),
      expense_date: new Date(exp.date).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("cabinet_expenses")
      .insert(mappedExpenses)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length 
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
