// GET /api/billing/revenue-forecast?months=3
// Predicts next N months revenue from confirmed future appointments

import { NextRequest, NextResponse } from "next/server";
import { mockPayments } from "@/lib/mock/payments";
import { mockClients } from "@/lib/mock/clients";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ahead = Math.min(parseInt(searchParams.get("months") ?? "2"), 4);

  const now  = new Date();
  const result: { label: string; projected: number; sessions: number }[] = [];

  // Build client price map
  const priceMap = Object.fromEntries(
    mockClients.map(c => [c.id, parseFloat(c.session_price ?? "0") || 0])
  );

  // For next N months, project assuming the client keeps their current session_frequency
  const FREQ_MAP: Record<string, number> = {
    SAPTAMANAL: 4,  // ~4 sessions/month
    BILUNAR:    2,
    LUNAR:      1,
    OCAZIONAL:  0.5,
  };

  for (let i = 1; i <= ahead; i++) {
    const dt    = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = dt.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

    let projected = 0;
    let sessions  = 0;

    for (const client of mockClients) {
      const freq  = FREQ_MAP[(client.session_frequency ?? "OCAZIONAL")] ?? 0;
      const price = priceMap[client.id] ?? 0;
      const s = Math.round(freq);
      sessions  += s;
      projected += s * price;
    }

    result.push({ label, projected, sessions });
  }

  // Also gather last 3 months actuals for comparison
  const history: { label: string; actual: number; sessions: number }[] = [];
  for (let i = 3; i >= 1; i--) {
    const dt    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y     = dt.getFullYear();
    const m     = dt.getMonth() + 1;
    const label = dt.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

    const monthPay = mockPayments.filter(p => {
      const d = new Date(p.appointment_date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    history.push({
      label,
      actual: monthPay.reduce((s, p) => s + p.amount, 0),
      sessions: monthPay.length,
    });
  }

  return NextResponse.json({ history, forecast: result });
}
