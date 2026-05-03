import { Baby, Building2, FileText, Heart, ShieldCheck } from "lucide-react";

import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { listClients } from "@/lib/clients/queries";
import { DocumentList } from "@/components/documents/document-list";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";

const DOC_TYPES = [
  {
    icon: FileText,
    title: "Contract Individual (Adult)",
    description: "Contract CPR standard pentru servicii psihologice individuale · TVA 0%",
  },
  {
    icon: Baby,
    title: "Contract pentru Minor",
    description: "Contract cu reprezentant legal · Legea 272/2004 · include bloc triplu de semnătură",
  },
  {
    icon: Building2,
    title: "Contract B2B / Firmă",
    description: "Contract cu o companie, angajator sau plătitor terț · include clauze de confidențialitate organizațională",
  },
  {
    icon: Heart,
    title: "Consimțământ Informat CAS",
    description: "Document pentru servicii decontate prin asigurări de sănătate · cu număr bilet de trimitere",
  },
  {
    icon: ShieldCheck,
    title: "Anexă GDPR",
    description: "Notă de informare și consimțământ GDPR · prelucrarea datelor cu caracter personal",
  },
] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
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

      {/* Document type overview cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_TYPES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="rounded-[1.75rem] border-border/60 shadow-sm">
            <CardHeader className="gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black tracking-tight">{title}</h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <SectionCard
        title="Generare documente"
        description="Alege tipul documentului, selectează clientul și descarcă PDF-ul direct din datele reale ale cabinetului."
        icon={FileText}
      >
        <div className="p-0">
          <DocumentList
            clients={activeClients}
            therapistName={therapistName}
            therapistEntity={therapistEntity}
            therapistCif={settings?.cif ?? undefined}
            defaultSessionPrice={settings?.default_session_price ?? 250}
            defaultClientId={clientId}
          />
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
