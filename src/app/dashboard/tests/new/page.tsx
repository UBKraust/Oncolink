"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TestBuilderForm } from "@/components/assessments/TestBuilderForm";
import { Button } from "@/components/ui/button";
import type { TestTemplate } from "@/lib/assessments/types";
import { saveTestTemplate } from "@/app/dashboard/tests/test-actions";
import { toast } from "@/components/ui/toast";
import { DashboardPage, EmptyState, PageHeader, SectionCard } from "@/components/app/page-shell";

export default function NewTestPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<Omit<TestTemplate, "id" | "created_at"> | null>(null);

  const handleSave = async (test: Omit<TestTemplate, "id" | "created_at">) => {
    setIsSaving(true);
    try {
      const res = await saveTestTemplate(test);
      if (res.success) {
        setSaved(test);
        toast.success("Testul a fost salvat în catalog.");
      } else {
        toast.error(res.error || "Eroare la salvare.");
      }
    } catch {
      toast.error("Eroare tehnică la salvare.");
    } finally {
      setIsSaving(false);
    }
  };

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
        title="Creare test personalizat"
        description="Construiește propriul inventar clinic cu întrebări, ponderi și sub-scale personalizate."
      />

      {!saved ? (
        <SectionCard
          title="Builder test"
          description="Definește structura întrebărilor și logica de scoring înainte de salvare."
        >
        <div className={isSaving ? "pointer-events-none opacity-50" : ""}>
          <TestBuilderForm onSave={handleSave} />
          {isSaving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se salvează în baza de date...
            </div>
          )}
        </div>
        </SectionCard>
      ) : (
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-2">
          <EmptyState
            title="Testul a fost salvat"
            description={`${saved.name} — ${saved.questions.length} întrebări, logică: ${saved.scoring_logic.type}`}
            icon={CheckCircle2}
          />
          <div className="flex justify-center gap-3 pb-6">
            <Button asChild variant="outline">
              <Link href="/dashboard/tests">
                Înapoi la catalog
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/tests/new" onClick={() => setSaved(null)}>
                Creează altul
              </Link>
            </Button>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
