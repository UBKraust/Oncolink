import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ClientForm } from "@/components/clients/client-form";
import {
  CardContent,
} from "@/components/ui/card";
import { createClient } from "@/app/dashboard/clients/actions";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

export default function NewClientPage() {
  return (
    <DashboardPage className="max-w-3xl">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      <PageHeader
        title="Client nou"
        description="Datele introduse vor fi folosite în fișa clinică, documente legale și facturare."
      />

      <SectionCard
        title="Date inițiale client"
        description="Completează profilul administrativ de bază pentru a crea fișa clientului."
      >
        <CardContent>
          <ClientForm
            action={createClient}
            submitLabel="Salvează client"
            cancelHref="/dashboard/clients"
          />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
