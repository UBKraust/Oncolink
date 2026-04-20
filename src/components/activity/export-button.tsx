"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityExportButtonProps {
  from?: string;
  to?: string;
}

export function ActivityExportButton({ from, to }: ActivityExportButtonProps) {
  const params = new URLSearchParams({ format: "csv" });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/api/activity/export?${params}`} download>
        <Download className="h-4 w-4" />
        Export CSV
      </a>
    </Button>
  );
}
