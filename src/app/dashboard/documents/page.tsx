import { FileText, ShieldCheck } from "lucide-react";

import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { listClients } from "@/lib/clients/queries";
import { DocumentList } from "@/components/documents/document-list";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";

export default async function DocumentsPage() {
  const configured = isSupabaseConfigured();
  const [clients, settings] = await Promise.all([
    listClients(),
    getTherapistSettings().catch(() => null),
  ]);
  const activeClients = clients.filter((c) => !c.notes_anonymized_at);
  const therapistName = settings?.full_name ?? settings?.practice_name ?? "Terapeut";
  const therapistEntity = settings?.practice_name ?? settings?.full_name ?? "Cabinet";

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Documente legale"
        description="Generează PDF-uri direct în browser, cu date reale din profilul cabinetului și fișa pacientului."
      />

      {!configured && (
        <SetupBanner description="Datele demo pentru documente au fost eliminate. Configurează Supabase și profilul cabinetului pentru a genera documente reale." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
          <CardHeader className="gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black tracking-tight">Contract Prestări Servicii</h2>
            <p className="text-sm text-muted-foreground">
              Contract CPR pentru servicii psihologice · TVA 0%
            </p>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
          <CardHeader className="gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black tracking-tight">Acord GDPR</h2>
            <p className="text-sm text-muted-foreground">
              Consimțământ pentru prelucrarea datelor, pregătit pentru configurarea cabinetului
            </p>
          </CardHeader>
        </Card>
      </div>

      <SectionCard
        title="Generare documente"
        description="Selectează clientul și generează contractul sau acordul GDPR direct din datele reale ale cabinetului."
        icon={FileText}
      >
        <div className="p-0">
          <DocumentList
            clients={activeClients}
            therapistName={therapistName}
            therapistEntity={therapistEntity}
            therapistCif={settings?.cif ?? undefined}
            defaultSessionPrice={settings?.default_session_price ?? 250}
          />
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
