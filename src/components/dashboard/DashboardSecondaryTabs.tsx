"use client";

import { Banknote, CalendarRange, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardSecondaryTabsProps {
  financialTab: React.ReactNode;
  upcomingTab: React.ReactNode;
  cabinetTab: React.ReactNode;
  counts: {
    unpaidInvoices: number;
    upcomingAppointments: number;
    vaultAlerts: number;
  };
}

export function DashboardSecondaryTabs({
  financialTab,
  upcomingTab,
  cabinetTab,
  counts,
}: DashboardSecondaryTabsProps) {
  return (
    <Tabs defaultValue="financiar">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl bg-muted/60 p-1.5">
        <TabsTrigger value="financiar" className="gap-2 rounded-xl px-4 py-2">
          <Banknote className="h-4 w-4" />
          Financiar
          {counts.unpaidInvoices > 0 && (
            <Badge variant="warning" className="h-5 min-w-5 px-1 text-[10px]">
              {counts.unpaidInvoices}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="programari" className="gap-2 rounded-xl px-4 py-2">
          <CalendarRange className="h-4 w-4" />
          Programări viitoare
          {counts.upcomingAppointments > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">
              {counts.upcomingAppointments}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="cabinet" className="gap-2 rounded-xl px-4 py-2">
          <Lock className="h-4 w-4" />
          Cabinet
          {counts.vaultAlerts > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
              {counts.vaultAlerts}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="financiar">{financialTab}</TabsContent>
      <TabsContent value="programari">{upcomingTab}</TabsContent>
      <TabsContent value="cabinet">{cabinetTab}</TabsContent>
    </Tabs>
  );
}
