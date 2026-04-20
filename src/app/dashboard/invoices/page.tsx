import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { FilePlus, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturi</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} facturi · {totalAmount.toFixed(2)} RON încasat
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <FilePlus className="h-4 w-4" />
            Factură nouă
          </Link>
        </Button>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — afișez date de mostră.
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Lista facturilor
          </CardTitle>
          <CardDescription>
            e-Factura ANAF · VAT 0% · SmartBill Cloud
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nicio factură găsită.
            </p>
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
      </Card>
    </div>
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
