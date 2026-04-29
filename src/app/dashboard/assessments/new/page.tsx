"use client";

import { use } from "react";
import { ChevronLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { TestExecutionForm } from "@/components/assessments/TestExecutionForm";
import { seededTests } from "@/lib/assessments/seededTests";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

interface Props {
  searchParams: Promise<{ testId?: string; clientId?: string; clientName?: string }>;
}

export default function NewAssessmentPage({ searchParams }: Props) {
  const { testId, clientId, clientName } = use(searchParams);

  // Find test from seeded catalog; default to first test
  const test = seededTests.find((t) => t.id === testId) ?? seededTests[0];

  return (
    <DashboardPage className="max-w-3xl">
      <Link
        href="/dashboard/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Catalog Teste
      </Link>

      <PageHeader
        title={test.name}
        description={test.description}
      />

      <SectionCard
        title="Administrare test"
        description="Răspunsurile și calculul scorului sunt salvate în contextul clientului selectat."
        icon={ClipboardCheck}
      >
        <div className="p-6">
          <TestExecutionForm 
            test={test} 
            clientId={clientId ?? ""} 
            clientName={clientName ?? "Pacient"} 
          />
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
