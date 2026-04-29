import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ClipboardList } from "lucide-react";

import { getClient } from "@/lib/clients/queries";
import { OnboardingForm } from "@/components/clients/OnboardingForm";
import type { ClientProfile } from "@/components/clients/types";
import {
  CardContent,
} from "@/components/ui/card";
import { DashboardPage, EmptyState, PageHeader, SectionCard } from "@/components/app/page-shell";

export default async function ClientOnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const profile = client as ClientProfile;

  if (client.notes_anonymized_at) {
    return (
      <DashboardPage className="max-w-2xl">
        <EmptyState
          title="Onboarding indisponibil"
          description="Clientul a fost anonimizat, deci fluxul de onboarding nu mai poate fi completat."
          icon={ClipboardList}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="max-w-2xl">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la fișa clientului
      </Link>

      <PageHeader
        title={`Onboarding — ${client.full_name}`}
        description="Completează datele administrative, contactul de urgență, sursa trimiterii și consimțământul GDPR."
      />

      <SectionCard
        title="Formular onboarding"
        description="Aceste informații completează dosarul administrativ înainte de primele ședințe."
        icon={ClipboardList}
      >
        <CardContent>
          <OnboardingForm
            clientId={id}
            clientName={profile.full_name ?? "Client"}
            defaults={{
              cnp_cif: profile.cnp_cif,
              address: profile.address,
              emergency_contact_name: profile.emergency_contact_name ?? null,
              emergency_contact_phone: profile.emergency_contact_phone ?? null,
              emergency_contact_relation: profile.emergency_contact_relation ?? null,
              referral_source: profile.referral_source ?? null,
              referred_by_name: profile.referred_by_name ?? null,
              gdpr_consent_signed: profile.gdpr_consent_signed ?? false,
            }}
          />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
