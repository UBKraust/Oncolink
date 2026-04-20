import { Plus, Settings2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPsychologicalTests } from "@/lib/mock/psychological_tests";

export default function TestsCatalogPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog Teste Psihologice</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestionează inventarele de evaluare și metricile de calcul.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Creare Test Nou
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockPsychologicalTests.map((test) => (
          <Card key={test.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <Badge variant="outline" className="bg-primary/5">JSONB</Badge>
              </div>
              <CardDescription className="line-clamp-2 mt-2">{test.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{test.questions.length} Întrebări (simulat pt. demo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>
                    Logică Scoring: <strong>{test.scoring_logic.type}</strong>
                  </span>
                </div>
              </div>
              
              {test.scoring_logic.subscales && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.keys(test.scoring_logic.subscales).map(sub => (
                    <Badge key={sub} variant="secondary" className="text-[10px] uppercase font-medium">Subscală: {sub}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 bg-muted/20">
              <div className="flex w-full justify-between items-center">
                <Button variant="ghost" size="sm" className="text-xs">Editează JSON Schema</Button>
                <Button variant="outline" size="sm" className="text-xs">Preview Formular</Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
