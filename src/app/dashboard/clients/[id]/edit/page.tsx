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
              gdpr_consent_signed: client.gdpr_consent_signed,
            }}
            submitLabel="Salvează modificările"
            cancelHref={`/dashboard/clients/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
