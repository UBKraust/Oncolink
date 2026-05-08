import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ClipboardList, FileEdit, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardContent } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, EmptyState, PageHeader, ReadinessBadge, SectionCard, SetupBanner, StatusBanner } from "@/components/app/page-shell";
import {
  getClinicalFormsReadiness,
  listClinicalForms,
  listTherapyReports,
} from "@/app/dashboard/forms/forms-actions";
import { FORM_TYPE_LABELS } from "@/components/clients/clinical-form-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FormsPage() {
  const configured = isSupabaseConfigured();
  let loadError: string | null = null;
  let readiness: Awaited<ReturnType<typeof getClinicalFormsReadiness>> = {
    state: "blocked",
    formsAvailable: false,
    reportsAvailable: false,
    message: "Modulul nu a fost încă verificat.",
  };

  let forms: Array<{
    id: string;
    client_id: string;
    form_type: string;
    title: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    clientName?: string | null;
  }> = [];

  let reports: Array<{
    id: string;
    client_id: string;
    report_type: string;
    report_number: string | null;
    title: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    clientName?: string | null;
  }> = [];

  if (configured) {
    try {
      readiness = await getClinicalFormsReadiness();
      const supabase = await createSupabaseServerClient();

      const [rawForms, rawReports, { data: clientsData, error: clientsError }] = await Promise.all([
        listClinicalForms(),
        listTherapyReports(),
        supabase.from("clients").select("id, full_name"),
      ]);

      if (clientsError) {
        throw new Error(clientsError.message);
      }

      const clientMap = new Map((clientsData ?? []).map((c) => [c.id, c.full_name]));

      forms = rawForms.map((f) => ({
        ...f,
        status: f.status,
        clientName: clientMap.get(f.client_id) ?? null,
      }));

      reports = rawReports.map((r) => ({
        ...r,
        status: r.status,
        clientName: clientMap.get(r.client_id) ?? null,
      }));
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "Nu am putut încărca fișele și rapoartele clinice în acest moment.";
    }
  }

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Fișe & Rapoarte Clinice"
        description="Gestionează fișele clinice completate și rapoartele psihologice ale clienților."
        action={
          <div className="flex items-center gap-2">
            {configured ? (
              <ReadinessBadge
                state={loadError ? "blocked" : readiness.state}
                label={loadError ? "Blocked" : readiness.state === "safe" ? "Safe" : readiness.state === "partial" ? "Partial" : "Blocked"}
              />
            ) : null}
            <Button asChild disabled={configured && (!readiness.reportsAvailable || Boolean(loadError))}>
              <Link href="/dashboard/forms/report/new">
                <Plus className="mr-2 h-4 w-4" />
                Raport nou
              </Link>
            </Button>
          </div>
        }
      />

      {!configured && (
        <SetupBanner description="Fișele și rapoartele clinice vor apărea aici după configurarea Supabase și aplicarea migrărilor P3." />
      )}

      {configured && loadError && (
        <StatusBanner
          title="Fișele clinice nu au putut fi încărcate"
          description={`Zona rămâne disponibilă, dar datele nu au putut fi citite acum. Dacă migrările P3 lipsesc sau conexiunea a eșuat, reîncearcă după remediere. Detaliu: ${loadError}`}
          tone="error"
        />
      )}

      {configured && !loadError && readiness.state !== "safe" && readiness.message ? (
        <StatusBanner
          title={readiness.state === "partial" ? "Modul clinic disponibil parțial" : "Modul clinic blocat"}
          description={readiness.message}
          tone={readiness.state === "partial" ? "warning" : "error"}
        />
      ) : null}

      <SectionCard
        title="Fișe clinice completate"
        description={`Anamneze, interviuri clinice, evaluări de risc, angajamente și planuri de consiliere.${configured ? ` Status: ${readiness.formsAvailable ? "ready" : "indisponibil"}.` : ""}`}
        icon={ClipboardList}
      >
        <CardContent className="p-0">
          {configured && !loadError && !readiness.formsAvailable ? (
            <EmptyState
              title="Fișele clinice nu sunt disponibile încă"
              description="Tabelele P3 pentru fișe clinice nu există sau nu sunt accesibile în această bază."
              icon={ClipboardList}
            />
          ) : configured && loadError ? (
            <EmptyState
              title="Nu am putut afișa fișele clinice"
              description="Această stare indică o problemă de încărcare sau de setup P3, nu lipsa reală a fișelor."
              icon={ClipboardList}
            />
          ) : forms.length === 0 ? (
            <EmptyState
              title="Nu există fișe clinice"
              description="Fișele se completează din fișa clientului, în secțiunea specifică tipului de serviciu."
              icon={ClipboardList}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Tip fișă</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {format(new Date(form.updated_at), "d MMM yyyy", { locale: ro })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {form.clientName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {FORM_TYPE_LABELS[form.form_type as keyof typeof FORM_TYPE_LABELS] ?? form.form_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        form.status === "COMPLETE"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {form.status === "COMPLETE" ? "Completat" : "Ciornă"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/clients/${form.client_id}`}>
                          Fișă client
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>

      <SectionCard
        title="Rapoarte psihologice"
        description={`Rapoarte de evaluare finalizate sau în elaborare, cu export PDF.${configured ? ` Status: ${readiness.reportsAvailable ? "ready" : "indisponibil"}.` : ""}`}
        icon={FileEdit}
      >
        <CardContent className="p-0">
          {configured && !loadError && !readiness.reportsAvailable ? (
            <EmptyState
              title="Rapoartele nu sunt disponibile încă"
              description="Infrastructura P3 pentru rapoarte psihologice nu este disponibilă în această bază."
              icon={FileEdit}
              action={{ label: "Vezi fișele clientului", href: "/dashboard/clients" }}
            />
          ) : configured && loadError ? (
            <EmptyState
              title="Nu am putut afișa rapoartele"
              description="Datele nu au fost încărcate corect, deci această stare nu înseamnă neapărat că nu există rapoarte."
              icon={FileEdit}
              action={{ label: "Raport nou", href: "/dashboard/forms/report/new" }}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              title="Nu există rapoarte"
              description="Creează primul raport psihologic folosind butonul Raport nou de mai sus."
              icon={FileEdit}
              action={{ label: "Raport nou", href: "/dashboard/forms/report/new" }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Nr. raport</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {format(new Date(report.updated_at), "d MMM yyyy", { locale: ro })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {report.clientName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {report.report_number ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {report.report_type === "MINOR" ? "Minor" : report.report_type === "B2B_WELLBEING" ? "B2B" : "Adult"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        report.status === "FINAL"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {report.status === "FINAL" ? "Final" : "Ciornă"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/forms/report/${report.id}`}>
                          Editează
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
