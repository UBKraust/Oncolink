"use client";

import { ImportDashboard } from "@/components/settings/ImportDashboard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ImportSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary hover:underline mb-2">
             <ChevronLeft className="h-4 w-4" />
             <Link href="/dashboard/settings" className="text-xs font-bold uppercase tracking-widest">
               Înapoi la Setări
             </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Import Date Istorice</h1>
          <p className="text-sm text-muted-foreground">
            Migrează încasările și cheltuielile din SmartBill pentru a popula rapoartele tale de performanță.
          </p>
        </div>
      </div>

      <ImportDashboard />
    </div>
  );
}
