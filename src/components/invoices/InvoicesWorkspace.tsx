"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CheckCircle2, FileCheck2, Loader2, Receipt, Send, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, MetricCard, SectionCard } from "@/components/app/page-shell";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  type InvoiceRow,
} from "@/lib/invoices/queries";
import { sendPreparedInvoicesBatch } from "@/app/dashboard/invoices/actions";

const INVOICE_STATUSES = ["PREGĂTITĂ", "EMISĂ", "PLĂTITĂ", "RESTANTĂ", "ANULATĂ"] as const;

const invoiceStatusVariant: Record<
  (typeof INVOICE_STATUSES)[number],
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  PREGĂTITĂ: "info",
  EMISĂ: "secondary",
  PLĂTITĂ: "success",
  RESTANTĂ: "destructive",
  ANULATĂ: "warning",
};

interface InvoicesWorkspaceProps {
  invoices: InvoiceRow[];
  activeStatus?: string;
  smartbillConfigured: boolean;
  loadError: string | null;
}

export function InvoicesWorkspace({
  invoices,
  activeStatus,
  smartbillConfigured,
  loadError,
}: InvoicesWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totals = useMemo(
    () =>
      INVOICE_STATUSES.reduce(
        (acc, status) => {
          acc[status] = invoices.filter((invoice) => invoice.status === status).length;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [invoices],
  );

  const preparedInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "PREGĂTITĂ"),
    [invoices],
  );

  const selectedPreparedInvoices = useMemo(
    () => preparedInvoices.filter((invoice) => selectedIds.has(invoice.id)),
    [preparedInvoices, selectedIds],
  );

  const totalCollected = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "PLĂTITĂ")
        .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    [invoices],
  );

  const totalPrepared = useMemo(
    () =>
      preparedInvoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    [preparedInvoices],
  );

  function toggleInvoice(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllPrepared() {
    setSelectedIds(new Set(preparedInvoices.map((invoice) => invoice.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBatchSend() {
    if (selectedPreparedInvoices.length === 0) {
      toast.error("Selectează cel puțin o factură pregătită.");
      return;
    }

    startTransition(async () => {
      const result = await sendPreparedInvoicesBatch(
        selectedPreparedInvoices.map((invoice) => invoice.id),
      );

      if (!result.ok && result.sentCount === 0) {
        toast.error(result.error ?? "Nu am putut trimite facturile în SmartBill.");
        return;
      }

      if (result.sentCount > 0 && result.failedCount === 0) {
        toast.success(`${result.sentCount} facturi au fost trimise în SmartBill.`);
      } else if (result.sentCount > 0) {
        toast.error(
          `${result.sentCount} facturi au fost trimise, dar ${result.failedCount} au eșuat.`,
        );
      }

      clearSelection();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileCheck2}
          label="Coada Financiară"
          value={preparedInvoices.length}
          iconClassName="bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100"
          trend={`${totalPrepared.toFixed(2)} RON pregătiți pentru emitere`}
        />
        <MetricCard
          icon={Send}
          label="Emise"
          value={(totals.EMISĂ ?? 0).toString()}
          iconClassName="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
          trend="Trimise în SmartBill și în așteptarea încasării"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Plătite"
          value={(totals.PLĂTITĂ ?? 0).toString()}
          iconClassName="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          trend={`${totalCollected.toFixed(2)} RON încasați`}
        />
        <MetricCard
          icon={Wallet}
          label="Restanțe"
          value={(totals.RESTANTĂ ?? 0).toString()}
          iconClassName="bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100"
          trend="Necesită follow-up financiar"
        />
      </div>

      <SectionCard
        title="Workspace Financiar"
        description="Coada PREGĂTITĂ este suprafața principală pentru financiar. Selectează facturile eligibile și trimite-le în SmartBill în lot."
        icon={FileCheck2}
      >
        <CardContent className="space-y-4 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {INVOICE_STATUSES.map((status) => (
              <Link
                key={status}
                href={status === activeStatus ? "/dashboard/invoices" : `/dashboard/invoices?status=${status}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  activeStatus === status
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {status} ({totals[status] ?? 0})
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-border/60 bg-muted/20 px-4 py-4">
            <Badge variant="info">
              {preparedInvoices.length} facturi pregătite
            </Badge>
            <span className="flex-1 text-sm text-muted-foreground">
              {selectedPreparedInvoices.length > 0
                ? `${selectedPreparedInvoices.length} facturi selectate pentru trimitere în SmartBill.`
                : "Selectează din tabel facturile PREGĂTITĂ pe care vrei să le emiți acum."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllPrepared}
              disabled={preparedInvoices.length === 0 || pending}
            >
              Selectează coada
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedIds.size === 0 || pending}
            >
              Resetează
            </Button>
            <Button
              size="sm"
              onClick={handleBatchSend}
              disabled={
                !smartbillConfigured ||
                pending ||
                selectedPreparedInvoices.length === 0 ||
                Boolean(loadError)
              }
              className="gap-1.5"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Trimite selectatele
            </Button>
          </div>
        </CardContent>
      </SectionCard>

      <SectionCard
        title="Lista facturilor"
        description="Statusul facturii face parte din istoricul operațional: PREGĂTITĂ -> EMISĂ -> PLĂTITĂ / RESTANTĂ / ANULATĂ."
        icon={Receipt}
      >
        <CardContent className="p-0">
          {loadError ? (
            <EmptyState
              title="Nu am putut afișa lista facturilor"
              description="Datele nu au fost încărcate corect, deci această stare nu indică lipsa facturilor. Reîncearcă după ce conexiunea revine."
              action={{ label: "Factură nouă", href: "/dashboard/invoices/new" }}
              icon={Receipt}
            />
          ) : invoices.length === 0 ? (
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
                  <TableHead className="w-12" />
                  <TableHead>Serie / Nr.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Dată emitere</TableHead>
                  <TableHead>Sumă (RON)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const isPrepared = invoice.status === "PREGĂTITĂ";
                  const isSelected = selectedIds.has(invoice.id);

                  return (
                    <TableRow
                      key={invoice.id}
                      className={cn(isSelected && "bg-primary/5")}
                    >
                      <TableCell className="text-center">
                        {isPrepared ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleInvoice(invoice.id)}
                            aria-label={`Selectează factura ${invoice.id}`}
                            className="h-4 w-4 rounded accent-primary"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.smartbill_series ?? "—"}/{invoice.smartbill_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {invoice.client_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invoice.issued_at), "d MMM yyyy", { locale: ro })}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {(invoice.amount ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoiceStatusVariant[
                              invoice.status as keyof typeof invoiceStatusVariant
                            ] ?? "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            Deschide
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </SectionCard>
    </div>
  );
}
