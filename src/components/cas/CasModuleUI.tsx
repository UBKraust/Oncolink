"use client";

import { useState } from "react";
import { Hospital, FileDown, CheckCircle2, Clock, Calendar, FileScan } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReferralUploader } from "@/components/cas/ReferralUploader";
import { EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { StatCard as DashboardStatCard } from "@/components/dashboard/stat-card";

export interface CasSession {
  id: string;
  client_id: string;
  client_name: string;
  cnp: string;
  appointment_date: string;
  diagnosis_code_cim10: string | null;
  diagnosis_label: string;
  referral_number: string | null;
  referral_date: string | null;
  referring_doctor_code: string | null;
}

function CasExportButton({ month }: { month: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/api/exports/cas?month=${month}`} download>
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV luna {month}
      </a>
    </Button>
  );
}

export function CasModuleUI({ sessions }: { sessions: CasSession[] }) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = (() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const [activeUpload, setActiveUpload] = useState<CasSession | null>(null);

  const grouped = sessions.reduce<Record<string, CasSession[]>>((acc, s) => {
    const key = new Date(s.appointment_date).toISOString().slice(0, 7);
    acc[key] = [...(acc[key] ?? []), s];
    return acc;
  }, {});

  const totalThisMonth = (grouped[thisMonth] ?? []).length;
  const totalLastMonth = (grouped[lastMonth] ?? []).length;
  const uniquePatients = new Set(sessions.map((s) => s.client_id)).size;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Modul CAS"
        description="Evidența ședințelor decontate prin Casa de Asigurări de Sănătate și exporturile lunare pentru raportarea SIUI."
        action={
          <div className="flex gap-2 flex-wrap justify-end">
            <CasExportButton month={lastMonth} />
            <CasExportButton month={thisMonth} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatCard label="Ședințe luna aceasta" value={String(totalThisMonth)} icon={Clock} />
        <DashboardStatCard label="Ședințe luna trecută" value={String(totalLastMonth)} icon={Calendar} />
        <DashboardStatCard label="Pacienți CAS activi" value={String(uniquePatients)} icon={CheckCircle2} tone="success" />
        <DashboardStatCard label="Total ședințe" value={String(sessions.length)} icon={Hospital} />
      </div>

      <SetupBanner
        title="Flux manual CNAS"
        description="Integrarea SIUI directă nu este disponibilă. Descarcă raportul CSV lunar și încarcă-l manual în portalul CNAS."
      />

      {activeUpload && (
        <SectionCard
          title={`Încarcă bilet pentru ${activeUpload.client_name}`}
          description={activeUpload.referral_number ? `Referință curentă: ${activeUpload.referral_number}` : "Adaugă documentația de trimitere pentru această ședință."}
          icon={FileScan}
        >
          <div className="space-y-3 p-6">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setActiveUpload(null)}>Anulează</Button>
            </div>
            <ReferralUploader
              clientId={activeUpload.client_id}
              initialReferralNumber={activeUpload.referral_number || ""}
              initialDoctorCode={activeUpload.referring_doctor_code || ""}
              initialDiagnosisCode={activeUpload.diagnosis_code_cim10 || ""}
              onUploaded={() => setActiveUpload(null)}
            />
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Registru servicii CAS"
        description="Ședințele sunt grupate pe lună pentru verificare rapidă și export operațional."
        icon={Hospital}
      >
        <div className="space-y-6 p-6">
          {sessions.length === 0 ? (
            <EmptyState
              title="Nu există ședințe CAS înregistrate"
              description="După marcarea programărilor decontate și completarea datelor de trimitere, registrul va apărea aici."
              icon={Hospital}
            />
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthSessions]) => (
                <div key={month} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-base capitalize tracking-tight">
                      {format(new Date(month + "-01"), "MMMM yyyy", { locale: ro })}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        ({monthSessions.length} ședințe)
                      </span>
                    </h2>
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/api/exports/cas?month=${month}`} download>
                        <FileDown className="h-3.5 w-3.5 mr-1" /> CSV
                      </a>
                    </Button>
                  </div>

                  <Card className="overflow-hidden border-border/60 shadow-sm">
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                            <th className="text-left px-4 py-2.5 font-medium">Data</th>
                            <th className="text-left px-4 py-2.5 font-medium">Pacient</th>
                            <th className="text-left px-4 py-2.5 font-medium">Diagnostic CIM-10</th>
                            <th className="text-left px-4 py-2.5 font-medium">Bilet Trimitere</th>
                            <th className="text-left px-4 py-2.5 font-medium">Parafă Medic</th>
                            <th className="text-left px-4 py-2.5 font-medium">Dosar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {monthSessions.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                {format(new Date(s.appointment_date), "d MMM", { locale: ro })}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium leading-none">{s.client_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                  {s.cnp.slice(0, 4)}***{s.cnp.slice(-3)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="font-mono text-xs mr-1.5">{s.diagnosis_code_cim10}</Badge>
                                <span className="text-xs text-muted-foreground">{s.diagnosis_label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-mono text-xs">{s.referral_number}</p>
                                <p className="text-xs text-muted-foreground">em. {s.referral_date}</p>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.referring_doctor_code}</code>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-primary"
                                  onClick={() => setActiveUpload(activeUpload?.id === s.id ? null : s)}
                                >
                                  <FileScan className="h-3.5 w-3.5" />
                                  {activeUpload?.id === s.id ? "Anulează" : "Bilet"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
