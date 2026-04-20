"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TestBuilderForm } from "@/components/assessments/TestBuilderForm";
import type { TestTemplate } from "@/lib/assessments/types";

export default function NewTestPage() {
  const [saved, setSaved] = useState<Omit<TestTemplate, "id" | "created_at"> | null>(null);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-10">
      <Link
        href="/dashboard/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Catalog Teste
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Creare Test Personalizat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Construiește propriul inventar clinic cu întrebări, ponderi și sub-scale personalizate.
        </p>
      </div>

      {!saved ? (
        <TestBuilderForm
          onSave={(test) => {
            setSaved(test);
            // TODO: persist to Supabase `psychological_tests` table
            console.log("[TestBuilder] Test salvat:", JSON.stringify(test, null, 2));
          }}
        />
      ) : (
        <div className="rounded-md border border-emerald-300 bg-emerald-50/50 p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-emerald-800">Testul a fost salvat!</p>
          <p className="text-sm text-emerald-700">
            <strong>{saved.name}</strong> — {saved.questions.length} întrebări, logică: {saved.scoring_logic.type}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/tests"
              className="text-sm text-primary hover:underline"
            >
              Înapoi la catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
