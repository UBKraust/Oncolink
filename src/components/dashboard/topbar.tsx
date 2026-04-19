"use client";

import { Lock, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DashboardTopbar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="relative hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Caută client, factură, programare…"
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Badge variant="warning" className="gap-1">
          <Lock className="h-3 w-3" />
          Note criptate
        </Badge>
        <Button size="sm" variant="outline">
          <Lock className="h-4 w-4" />
          Deblochează cu PIN
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Programare nouă
        </Button>
      </div>
    </header>
  );
}
