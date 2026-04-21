import { Lock } from "lucide-react";

import { VaultClient } from "@/components/vault/VaultClient";
import { listVaultDocuments } from "@/app/dashboard/vault/vault-actions";

export default async function VaultPage() {
  const docs = await listVaultDocuments();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Lock className="h-6 w-6 text-primary" />
            Seif Digital
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arhivator profesional privat pentru diplome, acte cabinet și facturi administrative.
            Toate documentele tale esențiale, securizate într-un singur loc.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {docs.length} document{docs.length !== 1 ? "e" : ""} salvate
        </div>
      </div>

      <VaultClient initialDocs={docs} />
    </div>
  );
}
