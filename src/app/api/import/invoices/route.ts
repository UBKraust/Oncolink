import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients/queries";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoices } = await req.json();
    if (!Array.isArray(invoices)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Fetch existing clients for matching
    const clients = await listClients();
    const clientMap = new Map(clients.map(c => [c.full_name?.toLowerCase(), c.id]));

    const mappedInvoices = invoices.map(inv => {
      const clientName = inv.client_name?.trim();
      const matchedId = clientName ? clientMap.get(clientName.toLowerCase()) : null;

      return {
        smartbill_series: inv.series || "SB",
        smartbill_number: inv.number,
        amount: parseFloat(inv.total),
        status: inv.status || "EMISĂ",
        smartbill_id: `${inv.series}-${inv.number}`,
        issued_at: new Date(inv.date).toISOString(),
        client_id: matchedId || null,
        client_name_historical: matchedId ? null : clientName,
        // historical invoices usually don't have an appointment link
        appointment_id: null, 
      };
    });

    const { data, error } = await supabase
      .from("invoices")
      .insert(mappedInvoices)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      matched: mappedInvoices.filter(i => i.client_id).length
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
