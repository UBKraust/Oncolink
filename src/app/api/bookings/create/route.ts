export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import {
  createPublicBooking,
  PublicBookingSchema,
} from "@/lib/booking/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviciu indisponibil în modul demo." },
      { status: 503 },
    );
  }

  // --- Parse & validate payload ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  const parsed = PublicBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const result = await createPublicBooking(parsed.data, req.headers);
  return NextResponse.json(result.body, { status: result.status });
}
