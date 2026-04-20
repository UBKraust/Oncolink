"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvoice } from "@/app/dashboard/invoices/actions";
import type { AppointmentWithClient } from "@/lib/appointments/queries";

interface InvoiceFormProps {
  appointments: AppointmentWithClient[];
  defaultAppointmentId?: string;
}

const initial = { ok: false, error: null };

export function InvoiceForm({
  appointments,
  defaultAppointmentId,
}: InvoiceFormProps) {
  const [state, dispatch, pending] = useActionState(createInvoice, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.invoiceId) {
      router.push(`/dashboard/invoices/${state.invoiceId}`);
    }
  }, [state, router]);

  return (
    <form action={dispatch} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="appointment_id">Programare</Label>
        <select
          id="appointment_id"
          name="appointment_id"
          defaultValue={defaultAppointmentId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">Alege programarea…</option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.client?.full_name ?? "—"} ·{" "}
              {format(new Date(a.appointment_date), "d MMM yyyy · HH:mm", {
                locale: ro,
              })}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Doar ședințele cu status FINALIZAT sunt afișate.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Sumă (RON, TVA 0%)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          defaultValue="250"
          required
          placeholder="250.00"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="session_label">Descriere serviciu</Label>
        <Input
          id="session_label"
          name="session_label"
          defaultValue="Ședință psihoterapie"
          placeholder="Ședință psihoterapie"
        />
      </div>

      <input type="hidden" name="is_draft" value="false" />

      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/invoices")}
        >
          Anulează
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Emite factură
        </Button>
      </div>
    </form>
  );
}
