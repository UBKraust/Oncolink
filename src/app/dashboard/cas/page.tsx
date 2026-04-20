"use client";

import { useState } from "react";
import { Hospital, FileDown, CheckCircle2, AlertCircle, Clock, Calendar, FileScan } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockCasAppointments } from "@/lib/mock/cas";
import { ReferralUploader } from "@/components/cas/ReferralUploader";
import type { MockCasAppointment } from "@/lib/mock/cas";

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

export default function CasModulePage() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = (() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const sessions = mockCasAppointments;
  const [activeUpload, setActiveUpload] = useState<MockCasAppointment | null>(null);

  const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
    const key = new Date(s.appointment_date).toISOString().slice(0, 7);
    acc[key] = [...(acc[key] ?? []), s];
    return acc;
  }, {});

  const totalThisMonth = (grouped[thisMonth] ?? []).length;
  const totalLastMonth = (grouped[lastMonth] ?? []).length;
  const uniquePatients = new Set(sessions.map((s) => s.client_id)).size;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Hospital className="h-6 w-6 text-primary" />
            Modul CAS — Servicii Decontate
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evidența ședințelor decontate prin Casa de Asigurări de Sănătate. Export CSV pentru raportare SIUI.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <CasExportButton month={lastMonth} />
          <CasExportButton month={thisMonth} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Ședințe luna aceasta" value={totalThisMonth} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Ședințe luna trecută" value={totalLastMonth} icon={<Calendar className="h-4 w-4" />} />
        <StatCard label="Pacienți CAS activi" value={uniquePatients} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Total ședințe (demo)" value={sessions.length} icon={<Hospital className="h-4 w-4" />} />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <div className="text-sm text-amber-800 dark:text-amber-400">
          <strong>Integrare SIUI directă nu este disponibilă</strong> — sistemul CNAS nu expune un API stabil.
          Descarcă raportul CSV lunar și încarcă-l manual în portalul <a href="https://www.cnas.ro" target="_blank" rel="noopener noreferrer" className="underline">cnas.ro</a>.
        </div>
      </div>

      {/* Upload Bilet panel */}
      {activeUpload && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Încarcă bilet pentru: <strong>{activeUpload.client_name}</strong>
              <span className="ml-2 text-xs text-muted-foreground">({activeUpload.referral_number})</span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setActiveUpload(null)}>Anulează</Button>
          </div>
          <ReferralUploader
            clientId={activeUpload.client_id}
            initialReferralNumber={activeUpload.referral_number}
            initialDoctorCode={activeUpload.referring_doctor_code}
            initialDiagnosisCode={activeUpload.diagnosis_code_cim10}
            onUploaded={() => setActiveUpload(null)}
          />
        </div>
      )}

      {/* Sessions by month */}
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, monthSessions]) => (
          <div key={month} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base capitalize">
                {format(new Date(month + "-01"), "MMMM yyyy", { locale: ro })}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({monthSessions.length} ședințe)
                </span>
              </h2>
              <Button asChild variant="ghost" size="sm">
                <a href={`/api/exports/cas?month=${month}`} download>
                  <FileDown className="h-3.5 w-3.5 mr-1" /> CSV
                </a>
              </Button>
            </div>

            <Card>
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
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
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
        ))}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
