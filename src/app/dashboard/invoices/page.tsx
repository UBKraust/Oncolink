import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { FilePlus, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INVOICE_STATUSES,
  invoiceStatusVariant,
  listInvoices,
} from "@/lib/invoices/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSmartBillConfigured } from "@/lib/smartbill/client";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const configured = isSupabaseConfigured();
  const smartbillOk = isSmartBillConfigured();

  const invoices = await listInvoices({ status });

  const totals = INVOICE_STATUSES.reduce(
    (acc, s) => {
      acc[s] = invoices.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalAmount = invoices
    .filter((i) => i.status === "PLĂTITĂ")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Facturi"
        description={`${invoices.length} facturi · ${totalAmount.toFixed(2)} RON încasat`}
        action={
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <FilePlus className="h-4 w-4" />
              Factură nouă
            </Link>
          </Button>
        }
      />

      {!configured && (
        <SetupBanner description="Registrul de facturi folosește acum doar date reale. Configurează Supabase pentru a vedea activitatea financiară." />
      )}

      {configured && !smartbillOk && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          SmartBill neconfigurat — facturile se salvează local fără trimitere
          API. Setează <code>SMARTBILL_USERNAME</code>,{" "}
          <code>SMARTBILL_TOKEN</code>, <code>SMARTBILL_CIF</code>.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterLink href="/dashboard/invoices" active={!status} label="Toate" />
        {INVOICE_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/dashboard/invoices?status=${s}`}
            active={status === s}
            label={`${s} (${totals[s] ?? 0})`}
          />
        ))}
      </div>

      <SectionCard
        title="Lista facturilor"
        description="e-Factura ANAF · VAT 0% · SmartBill Cloud"
        icon={Receipt}
      >
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              title="Nu există facturi înregistrate"
              description="Prima factură emisă va apărea aici împreună cu statusul ei de încasare."
              action={{ label: "Creează o factură", href: "/dashboard/invoices/new" }}
              icon={Receipt}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serie / Nr.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Dată emitere</TableHead>
                  <TableHead>Sumă (RON)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">
                      {inv.smartbill_series ?? "—"}/{inv.smartbill_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {inv.client_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(inv.issued_at), "d MMM yyyy", {
                        locale: ro,
                      })}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {(inv.amount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoiceStatusVariant[
                            inv.status as keyof typeof invoiceStatusVariant
                          ] ?? "secondary"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/invoices/${inv.id}`}>
                          Deschide
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
