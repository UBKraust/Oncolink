import { NextResponse } from "next/server";

import { getClientAccessHistory, getClientStatusHistory } from "@/lib/clients/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const [statusHistory, accessHistory] = await Promise.all([
      getClientStatusHistory(id),
      getClientAccessHistory(id),
    ]);

    const lifecycleHistory = statusHistory.map((item) => {
      const meta =
        item.metadata != null && typeof item.metadata === "object" && !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : {};

      return {
        id: item.id,
        from_status: item.from_status,
        to_status: item.to_status,
        reason: item.reason,
        changed_at: item.changed_at,
        changed_by_name: typeof meta.changed_by_name === "string" ? meta.changed_by_name : null,
      };
    });

    return NextResponse.json({
      lifecycleHistory,
      accessHistory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut încărca istoricul lifecycle.",
      },
      { status: 500 },
    );
  }
}
