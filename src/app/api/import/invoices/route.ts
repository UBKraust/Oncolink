export const runtime = "edge";

import { NextResponse } from "next/server";
import {
  InvoiceImportPayloadSchema,
  normalizeImportedInvoice,
} from "@/lib/imports/smartbill";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients/queries";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const parsed = InvoiceImportPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { invoices } = parsed.data;

    // Fetch existing clients for matching
    const clients = await listClients();
    const clientMap = new Map(
      clients.map((client) => [client.full_name?.trim().toLowerCase(), client.id]),
    );

    const mappedInvoices = invoices.map((invoice) => {
      const normalizedInvoice = normalizeImportedInvoice(invoice);
      const clientName = normalizedInvoice.clientName;
      const matchedId = clientName ? clientMap.get(clientName.toLowerCase()) : null;

      return {
        therapist_id: authData.user.id,
        smartbill_series: normalizedInvoice.series,
        smartbill_number: normalizedInvoice.number,
        amount: normalizedInvoice.amount,
        status: normalizedInvoice.status,
        smartbill_id: `${normalizedInvoice.series}-${normalizedInvoice.number}`,
        issued_at: normalizedInvoice.dateIso,
        client_id: matchedId || null,
        client_name: clientName,
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
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import error" },
      { status: 500 },
    );
  }
}
