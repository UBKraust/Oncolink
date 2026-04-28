import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ClipboardList, ClipboardCheck, History, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAssessments } from "@/lib/mock/assessments";
import { mockClients } from "@/lib/mock/clients";
import { seededTests } from "@/lib/assessments/seededTests";
type AssessmentRegistryRow = {
  id: string;
  client_id: string | null;
  created_at: string;
  calculated_score: unknown;
  client:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  test:
    | { name: string | null }
    | { name: string | null }[]
    | null;
};

export default async function AssessmentsRegistryPage() {
  const configured = isSupabaseConfigured();
  let assessments: AssessmentRegistryRow[] = [];

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("client_assessments")
      .select(`
        *,
        client:clients(full_name),
        test:psychological_tests(name)
      `)
      .order("created_at", { ascending: false });
    assessments = (data ?? []) as AssessmentRegistryRow[];
  } else {
    // Enrich mock assessments with seeded test names for display
    assessments = mockAssessments.map((a) => {
      const testType = String(a.scoring_data.test_type ?? "").toLowerCase();
      const test = seededTests.find((t) => t.name.toLowerCase().includes(testType));
      const client = mockClients.find((c) => c.id === a.client_id);
      return {
        ...a,
        client: { full_name: client?.full_name ?? "Client demo" },
        test: { name: test?.name ?? "Test Standard" },
        calculated_score: null,
      };
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluări Psihologice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registrul complet al diagnosticelor și evaluărilor periodice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/tests">
              <ClipboardList className="mr-2 h-4 w-4" />
              Catalog Teste
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/assessments/new">
              <Plus className="mr-2 h-4 w-4" />
              Evaluare Nouă
            </Link>
          </Button>
        </div>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Mod demo — date de mostră.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Istoric Evaluări
          </CardTitle>
          <CardDescription>
            Toate testele administrate în cadrul cabinetului, cu scoruri calculate și interpretări.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {assessments.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground italic">
              Nicio evaluare înregistrată momentan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pacient</TableHead>
                  <TableHead>Test / Evaluare</TableHead>
                  <TableHead>Scor / Rezultat</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => {
                  const clientRelation = Array.isArray(assessment.client)
                    ? assessment.client[0]
                    : assessment.client;
                  const testRelation = Array.isArray(assessment.test)
                    ? assessment.test[0]
                    : assessment.test;

                  return (
                  <TableRow key={assessment.id}>
                    <TableCell className="text-sm tabular-nums">
                      {format(new Date(assessment.created_at), "d MMM yyyy", { locale: ro })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {clientRelation?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                          {testRelation?.name ?? "Evaluare"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assessment.calculated_score ? (
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-semibold text-slate-700">
                            {JSON.stringify(assessment.calculated_score).slice(0, 30)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          În procesare
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/clients/${assessment.client_id}`}>
                          Vezi Fișă
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
