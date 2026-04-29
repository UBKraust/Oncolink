import { VaultClient } from "@/components/vault/VaultClient";
import { listVaultDocuments } from "@/app/dashboard/vault/vault-actions";
import { DashboardPage } from "@/components/app/page-shell";

export default async function VaultPage() {
  const docs = await listVaultDocuments();

  return (
    <DashboardPage className="max-w-6xl">
      <VaultClient initialDocs={docs} />
    </DashboardPage>
  );
}
