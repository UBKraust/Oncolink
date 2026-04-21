"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TestBuilderForm } from "@/components/assessments/TestBuilderForm";
import type { TestTemplate } from "@/lib/assessments/types";
import { saveTestTemplate } from "@/app/dashboard/tests/test-actions";
import { toast } from "@/components/ui/toast";

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
    } catch (err) {
      toast.error("Eroare tehnică la salvare.");
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className={isSaving ? "opacity-50 pointer-events-none" : ""}>
          <TestBuilderForm onSave={handleSave} />
          {isSaving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se salvează în baza de date...
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-300 bg-emerald-50/50 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-emerald-800">Testul a fost salvat!</p>
          <p className="text-sm text-emerald-700">
            <strong>{saved.name}</strong> — {saved.questions.length} întrebări, logică: {saved.scoring_logic.type}
          </p>
          <div className="flex gap-3 justify-center pt-4">
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
    </div>
  );
}

// Small helper component if needed, or I'll just use raw buttons
function Button({ children, asChild, variant, ...props }: any) {
  if (asChild) return children;
  return (
    <button 
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        variant === 'outline' 
          ? 'border border-input bg-background hover:bg-accent' 
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
