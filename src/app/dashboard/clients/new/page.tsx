export const runtime = "edge";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ClientForm } from "@/components/clients/client-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/app/dashboard/clients/actions";

export default function NewClientPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Client nou</CardTitle>
          <CardDescription>
            Datele introduse vor fi stocate criptat la rest și utilizate pentru
            Contract, Consimțământ GDPR și facturare SmartBill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={createClient}
            submitLabel="Salvează client"
            cancelHref="/dashboard/clients"
          />
        </CardContent>
      </Card>
    </div>
  );
}
