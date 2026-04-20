import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listClients } from "@/lib/clients/queries";
import { DocumentList } from "@/components/documents/document-list";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DocumentsPage() {
  const configured = isSupabaseConfigured();
  const clients = await listClients();
  const activeClients = clients.filter((c) => !c.notes_anonymized_at);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documente legale</h1>
        <p className="text-sm text-muted-foreground">
          Generează PDF-uri direct în browser — niciun fișier nu trece prin server.
        </p>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — documentele se generează cu date de mostră.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Contract Prestări Servicii</CardTitle>
            <CardDescription>
              Contract CPR pentru servicii psihologice · TVA 0%
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Acord GDPR</CardTitle>
            <CardDescription>
              Consimțământ prelucrare date · ANSPDCP compliant
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <DocumentList clients={activeClients} />
    </div>
  );
}
