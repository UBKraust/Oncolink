import { VaultClient } from "@/components/vault/VaultClient";
import { listVaultDocuments } from "@/app/dashboard/vault/vault-actions";
import { DashboardPage, PageHeader } from "@/components/app/page-shell";

export default async function VaultPage() {
  const docs = await listVaultDocuments();

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Seif digital"
        description="Arhivator profesional pentru diplome, acte cabinet și documente administrative cu valabilitate urmărită centralizat."
        action={
          <div className="rounded-2xl border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
            {docs.length} document{docs.length !== 1 ? "e" : ""} salvate
          </div>
        }
      />

      <VaultClient initialDocs={docs} />
    </DashboardPage>
  );
}
