"use client";

import { AlertTriangle, ClipboardList, FileCheck2, Scale, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplianceTabsProps {
  alertsTab: React.ReactNode;
  documentsTab: React.ReactNode;
  assessmentsTab: React.ReactNode;
  legalTab: React.ReactNode;
  counts: {
    alerts: number;
    criticalAlerts: number;
    documents: number;
    highDocuments: number;
    assessments: number;
    highAssessments: number;
  };
}

export function ComplianceTabs({
  alertsTab,
  documentsTab,
  assessmentsTab,
  legalTab,
  counts,
}: ComplianceTabsProps) {
  return (
    <Tabs defaultValue="alerte">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl bg-muted/60 p-1.5">
        <TabsTrigger value="alerte" className="gap-2 rounded-xl px-4 py-2">
          <ShieldAlert className="h-4 w-4" />
          Alerte
          {counts.alerts > 0 && (
            <Badge
              variant={counts.criticalAlerts > 0 ? "destructive" : "warning"}
              className="h-5 min-w-5 px-1 text-[10px]"
            >
              {counts.alerts}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="documente" className="gap-2 rounded-xl px-4 py-2">
          <FileCheck2 className="h-4 w-4" />
          Documente
          {counts.documents > 0 && (
            <Badge
              variant={counts.highDocuments > 0 ? "destructive" : "warning"}
              className="h-5 min-w-5 px-1 text-[10px]"
            >
              {counts.documents}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="evaluari" className="gap-2 rounded-xl px-4 py-2">
          <ClipboardList className="h-4 w-4" />
          Evaluări
          {counts.assessments > 0 && (
            <Badge
              variant={counts.highAssessments > 0 ? "destructive" : "secondary"}
              className="h-5 min-w-5 px-1 text-[10px]"
            >
              {counts.assessments}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="juridic" className="gap-2 rounded-xl px-4 py-2">
          <Scale className="h-4 w-4" />
          Juridic
          <AlertTriangle className="h-3 w-3 text-muted-foreground/60" />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="alerte">{alertsTab}</TabsContent>
      <TabsContent value="documente">{documentsTab}</TabsContent>
      <TabsContent value="evaluari">{assessmentsTab}</TabsContent>
      <TabsContent value="juridic">{legalTab}</TabsContent>
    </Tabs>
  );
}
