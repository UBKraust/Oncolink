"use client";

import { ImportDashboard } from "@/components/settings/ImportDashboard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

export default function ImportSettingsPage() {
  return (
    <DashboardPage className="max-w-5xl">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la setări
      </Link>

      <PageHeader
        title="Import date istorice"
        description="Migrează încasările și cheltuielile din SmartBill pentru a popula rapoartele de performanță și arhiva contabilă."
      />

      <SectionCard
        title="Import și reconciliere"
        description="Conectează sursa externă, verifică datele aduse și confirmă importul înainte de publicare."
      >
        <div className="p-6">
          <ImportDashboard />
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
