import { Plus, FileText, Settings2, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { seededTests } from "@/lib/assessments/seededTests";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";

export default function TestsCatalogPage() {
  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Catalog teste psihologice"
        description="Administrează inventarele standardizate și creează teste proprii pentru evaluări."
        action={
          <Button asChild>
            <Link href="/dashboard/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Test nou (custom)
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {seededTests.map((test) => {
          const hasSubscales =
            test.scoring_logic.type === "SUBSCALES" &&
            (test.scoring_logic.subscales?.length ?? 0) > 0;

          return (
            <Card key={test.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base leading-snug">{test.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                    Open-Source
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">{test.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{test.questions.length} întrebări</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Scoring: <strong>{test.scoring_logic.type}</strong></span>
                </div>

                {hasSubscales && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {test.scoring_logic.subscales!.map((s) => (
                      <Badge key={s.name} variant="outline" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t pt-4 gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/assessments/new?testId=${test.id}`}>
                    <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                    Administrează
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </DashboardPage>
  );
}
