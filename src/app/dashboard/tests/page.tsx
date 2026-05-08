"use client";

import { useState } from "react";
import { Plus, Clock, Users, FlaskConical, BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { seededTests } from "@/lib/assessments/seededTests";
import { internalForms } from "@/lib/assessments/internalForms";
import { DashboardPage, PageHeader, ReadinessBadge, StatusBanner } from "@/components/app/page-shell";
import type { TestTemplate, TestCategory, LicenseStatus } from "@/lib/assessments/types";

// ─── Catalog metadata ────────────────────────────────────────────────────────

const ALL_TESTS: TestTemplate[] = [...seededTests, ...internalForms];

const CATEGORY_LABELS: Record<TestCategory | "ALL", string> = {
  ALL:                         "Toate",
  SCREENING_RAPID:             "Screening",
  DEPRESIE:                    "Depresie",
  ANXIETATE:                   "Anxietate",
  STRES_WELLBEING:             "Stres & Wellbeing",
  CBT:                         "CBT",
  DBT:                         "DBT",
  RISC_CRIZA:                  "Risc & Criză",
  COPII_ADOLESCENTI:           "Minori",
  PERSONALITATE_CLINIC_AVANSAT:"Clinic avansat",
  FORMULARE_INTERNE:           "Formulare interne",
};

const LICENSE_CONFIG: Record<LicenseStatus, { label: string; variant: "success" | "warning" | "secondary" | "outline" }> = {
  OPEN_VERIFY:   { label: "Open / verificat",  variant: "success"   },
  LICENSED:      { label: "Licențiat",         variant: "warning"   },
  INTERNAL_FORM: { label: "Formular intern",   variant: "secondary" },
  RESEARCH_ONLY: { label: "Research",          variant: "outline"   },
};

const TRACK_LABELS: Record<string, string> = {
  CLINICAL_PSYCHOLOGY: "Clinică",
  CBT:                 "CBT",
  DBT:                 "DBT",
  COUNSELING:          "Consiliere",
  MINOR:               "Minori",
  RESEARCH:            "Research",
};

const FREQ_LABELS: Record<string, string> = {
  T0:       "T0",
  T1:       "T1",
  T2:       "T2",
  SESSION:  "Per ședință",
  AS_NEEDED:"La nevoie",
};

const AGE_LABELS: Record<string, string> = {
  adult:      "Adult",
  adolescent: "Adolescent",
  child:      "Copil",
  all:        "Toate vârstele",
};

function hasTestPlaceholders(test: TestTemplate) {
  return test.questions.some((q) =>
    q.text?.includes("de completat") || q.text?.includes("placeholder")
  );
}

function getTestReadiness(test: TestTemplate): "safe" | "partial" | "blocked" {
  if (hasTestPlaceholders(test)) return "blocked";
  if (test.meta?.licenseStatus === "INTERNAL_FORM") return "safe";
  return "partial";
}

// ─── Test Card ───────────────────────────────────────────────────────────────

function TestCard({ test }: { test: TestTemplate }) {
  const meta = test.meta;
  const licConfig = meta ? LICENSE_CONFIG[meta.licenseStatus] : null;
  const hasPlaceholders = hasTestPlaceholders(test);
  const readiness = getTestReadiness(test);

  return (
    <Card className="flex flex-col rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <CardTitle className="text-base leading-snug">{test.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {licConfig && (
                <Badge variant={licConfig.variant} className="shrink-0 text-[10px] uppercase tracking-wide">
                  {licConfig.label}
                </Badge>
              )}
              <ReadinessBadge
                state={readiness}
                label={readiness === "safe" ? "Safe" : readiness === "partial" ? "Partial" : "Blocked"}
              />
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-1 text-xs">
          {test.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Meta chips */}
        {meta && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {meta.estimatedDurationMinutes} min
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {AGE_LABELS[meta.ageGroup]}
            </span>
            {meta.recommendedFrequency.map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {FREQ_LABELS[f] ?? f}
              </span>
            ))}
          </div>
        )}

        {/* Service tracks */}
        {meta && meta.serviceTracks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meta.serviceTracks.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {TRACK_LABELS[t] ?? t}
              </Badge>
            ))}
          </div>
        )}

        {/* Subscales */}
        {test.scoring_logic.type === "SUBSCALES" && test.scoring_logic.subscales && (
          <div className="flex flex-wrap gap-1">
            {test.scoring_logic.subscales.map((s) => (
              <span
                key={s.name}
                className="rounded-md bg-primary/8 px-2 py-0.5 text-[10px] text-primary/80"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Placeholder warning */}
        {hasPlaceholders && (
          <div className="flex items-start gap-1.5 rounded-lg border border-warning/30 bg-warning/5 px-2.5 py-2 text-[11px] text-warning">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>Itemi placeholder — completează cu versiunea românească oficială înainte de utilizare clinică.</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 gap-2">
        {hasPlaceholders ? (
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Blocat până la completare
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/dashboard/assessments/new?testId=${test.id}`}>
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
              Administrează
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type FilterCategory = TestCategory | "ALL";

export default function TestsCatalogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");
  const blockedCount = ALL_TESTS.filter((test) => getTestReadiness(test) === "blocked").length;
  const partialCount = ALL_TESTS.filter((test) => getTestReadiness(test) === "partial").length;
  const safeCount = ALL_TESTS.filter((test) => getTestReadiness(test) === "safe").length;

  // Collect categories that have at least one test
  const usedCategories = Array.from(
    new Set(ALL_TESTS.map((t) => t.meta?.category).filter(Boolean) as TestCategory[])
  );

  const filters: FilterCategory[] = ["ALL", ...usedCategories];

  const visibleTests =
    activeFilter === "ALL"
      ? ALL_TESTS
      : ALL_TESTS.filter((t) => t.meta?.category === activeFilter);

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Catalog teste psihologice"
        description={`${ALL_TESTS.length} instrumente — screening, formulare interne CBT/DBT și instrumente clinice.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ReadinessBadge state="safe" label={`Safe ${safeCount}`} />
            <ReadinessBadge state="partial" label={`Partial ${partialCount}`} />
            <ReadinessBadge state="blocked" label={`Blocked ${blockedCount}`} />
            <Button variant="outline" asChild>
              <Link href="/dashboard/tests/new">
                <Plus className="mr-2 h-4 w-4" />
                Test custom
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/assessments/new">
                <FlaskConical className="mr-2 h-4 w-4" />
                Evaluare nouă
              </Link>
            </Button>
          </div>
        }
      />

      {blockedCount > 0 ? (
        <StatusBanner
          title="Catalog disponibil parțial clinic"
          description={`${blockedCount} instrumente sunt blocate din administrare deoarece conțin itemi placeholder. Ele rămân vizibile pentru planificare, dar nu pot fi folosite clinic până la completare.`}
          tone="warning"
        />
      ) : null}

      {/* License legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        {Object.entries(LICENSE_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
            <span>
              {key === "OPEN_VERIFY" && "— posibil liber, verificat înainte de producție"}
              {key === "LICENSED"    && "— licențiat, nu se adaugă itemi fără drept"}
              {key === "INTERNAL_FORM" && "— formular intern, fără risc de licență"}
              {key === "RESEARCH_ONLY" && "— util pentru export anonim / doctorat"}
            </span>
          </span>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {filters.map((cat) => {
          const count =
            cat === "ALL"
              ? ALL_TESTS.length
              : ALL_TESTS.filter((t) => t.meta?.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeFilter === cat
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {visibleTests.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nu există teste în această categorie.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
