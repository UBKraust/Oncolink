"use client";

import { use } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TestExecutionForm } from "@/components/assessments/TestExecutionForm";
import { seededTests } from "@/lib/assessments/seededTests";

interface Props {
  searchParams: Promise<{ testId?: string; clientId?: string; clientName?: string }>;
}

export default function NewAssessmentPage({ searchParams }: Props) {
  const { testId, clientName } = use(searchParams);

  // Find test from seeded catalog; default to first test
  const test = seededTests.find((t) => t.id === testId) ?? seededTests[0];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-10">
      <Link
        href="/dashboard/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Catalog Teste
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{test.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
      </div>

      <TestExecutionForm test={test} clientName={clientName ?? "Pacient"} />
    </div>
  );
}
