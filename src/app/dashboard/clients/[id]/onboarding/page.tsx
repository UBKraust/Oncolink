import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ClipboardList } from "lucide-react";

import { getClient } from "@/lib/clients/queries";
import { OnboardingForm } from "@/components/clients/OnboardingForm";
import type { ClientProfile } from "@/components/clients/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground">
          Clientul a fost anonimizat — onboarding indisponibil.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la fișa clientului
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Onboarding — {client.full_name}
          </CardTitle>
          <CardDescription>
            Completează datele administrative, contactul de urgență, sursa trimiterii
            și confirmă consimțământul GDPR.
          </CardDescription>
        </CardHeader>
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
      </Card>
    </div>
  );
}
