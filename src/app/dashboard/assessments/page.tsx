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
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
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
  }

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Evaluări psihologice"
        description="Registrul complet al diagnosticelor și evaluărilor periodice."
        action={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tests">
                <ClipboardList className="mr-2 h-4 w-4" />
                Catalog teste
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/assessments/new">
                <Plus className="mr-2 h-4 w-4" />
                Evaluare nouă
              </Link>
            </Button>
          </>
        }
      />

      {!configured ? (
        <SetupBanner description="Istoricul evaluărilor va apărea aici după configurarea Supabase și a testelor reale." />
      ) : null}

      <SectionCard
        title="Istoric evaluări"
        description="Toate testele administrate în cadrul cabinetului, cu scoruri calculate și interpretări."
        icon={History}
      >
        <CardContent className="p-0">
          {assessments.length === 0 ? (
            <EmptyState
              title="Nu există evaluări înregistrate"
              description="Când începi să administrezi teste reale, rezultatele și istoricul lor vor apărea aici."
              action={{ label: "Creează o evaluare", href: "/dashboard/assessments/new" }}
              icon={ClipboardCheck}
            />
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
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {testRelation?.name ?? "Evaluare"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assessment.calculated_score ? (
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-foreground">
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
      </SectionCard>
    </DashboardPage>
  );
}
