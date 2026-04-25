import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ClientForm } from "@/components/clients/client-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateClient } from "@/app/dashboard/clients/actions";
import { getClient } from "@/lib/clients/queries";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const boundUpdate = updateClient.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la fișă
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editează {client.full_name ?? "client"}</CardTitle>
          <CardDescription>
            Modificările sunt auditate în activity_logs și reflectate în documente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={boundUpdate}
            defaults={{
              full_name: client.full_name ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              cnp_cif: client.cnp_cif ?? "",
              address: client.address ?? "",
              date_of_birth: client.date_of_birth ?? "",
              client_id_series: client.client_id_series ?? "",
              client_id_number: client.client_id_number ?? "",
              gdpr_consent_signed: client.gdpr_consent_signed,
              location: client.location ?? "CABINET_PARTICULAR",
              is_minor: client.is_minor ?? false,
              minor_cnp: client.minor_cnp ?? "",
              parent_name: client.parent_1_name ?? client.parent_name ?? "",
              parent_phone: client.parent_1_phone ?? client.parent_phone ?? "",
              parent_1_email: client.parent_1_email ?? "",
              parent_cnp: client.parent_cnp ?? "",
              parent_address: client.parent_address ?? "",
              parent_id_series: client.parent_id_series ?? "",
              parent_id_number: client.parent_id_number ?? "",
              billing_type: client.billing_type ?? "INDIVIDUAL",
              company_name: client.company_name ?? "",
              company_address: client.company_address ?? "",
              company_iban: client.company_iban ?? "",
              company_bank: client.company_bank ?? "",
              company_representative_name: client.company_representative_name ?? "",
              company_representative_email: client.company_representative_email ?? "",
              company_representative_role: client.company_representative_role ?? "",
              company_reg_com: client.company_reg_com ?? "",
              session_price: client.session_price?.toString() ?? "",
              session_frequency: client.session_frequency ?? "SAPTAMANAL",
              report_frequency: client.report_frequency ?? "NICIODATA",
              send_report_to_parent: client.send_report_to_parent ?? false,
            }}
            submitLabel="Salvează modificările"
            cancelHref={`/dashboard/clients/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
