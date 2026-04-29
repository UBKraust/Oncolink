import Link from "next/link";
import { ChevronLeft, Baby } from "lucide-react";

import { MinorOnboardingForm } from "@/components/clients/MinorOnboardingForm";
import {
  CardContent,
} from "@/components/ui/card";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

export default function NewMinorClientPage() {
  return (
    <DashboardPage className="max-w-2xl">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      <PageHeader
        title="Pacient minor nou"
        description="Onboarding pentru pacient minor: date personale, reprezentare legală și documentația de custodie."
      />

      <SectionCard
        title="Înregistrare pacient minor"
        description="Completează datele minorului și ale reprezentanților legali înainte de activarea fișei."
        icon={Baby}
      >
        <CardContent>
          <MinorOnboardingForm />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
