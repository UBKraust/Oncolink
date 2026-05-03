"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  full_name: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  email: z.string().email("Adresă de email invalidă"),
  phone: z.string().min(7, "Numărul de telefon este prea scurt"),
  cnp_cif: z.string().optional(),
  address: z.string().optional(),
  slot_start: z.string().min(1, "Selectează data și ora"),
  duration_minutes: z.coerce.number().int().min(25).max(240).default(50),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface BookingFormProps {
  onSuccess?: (appointmentId: string) => void;
  therapistSlug?: string | null;
}

const DURATIONS = [
  { value: 25, label: "25 min" },
  { value: 50, label: "50 min (standard)" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getMinimumBookingDateTime() {
  return toDatetimeLocalValue(new Date(Date.now() + 60 * 60_000));
}

export function BookingForm({ onSuccess, therapistSlug }: BookingFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [minDateTime] = useState(getMinimumBookingDateTime);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInput, undefined, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 50 },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    // Convert local datetime to UTC ISO 8601
    const slotDate = new Date(values.slot_start);
    const payload = {
      ...values,
      therapist_slug: therapistSlug,
      website: "",
      slot_start: slotDate.toISOString(),
    };

    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 409) {
      setServerError(
        "⚠️ Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
      );
      return;
    }

    if (!res.ok) {
      setServerError(data.error ?? "A apărut o eroare. Încearcă din nou.");
      return;
    }

    setSuccess(true);
    reset();
    onSuccess?.(data.appointmentId);
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h3 className="text-lg font-semibold text-foreground">
          Programare confirmată!
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Veți primi un email de confirmare în curând.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          Programare nouă
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {serverError}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nume complet *" error={errors.full_name?.message}>
          <Input {...register("full_name")} placeholder="Ion Popescu" autoComplete="name" />
        </Field>

        <Field label="Email *" error={errors.email?.message}>
          <Input {...register("email")} type="email" placeholder="ion@exemplu.ro" autoComplete="email" />
        </Field>

        <Field label="Telefon *" error={errors.phone?.message}>
          <Input {...register("phone")} type="tel" placeholder="+40 700 000 000" autoComplete="tel" />
        </Field>

        <Field label="CNP / CIF" error={errors.cnp_cif?.message}>
          <Input {...register("cnp_cif")} placeholder="1234567890123" />
        </Field>
      </div>

      <Field label="Adresă (pentru factură)" error={errors.address?.message}>
        <Input {...register("address")} placeholder="Str. Exemplu nr. 1, București" autoComplete="street-address" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data și ora *" error={errors.slot_start?.message}>
          <Input
            {...register("slot_start")}
            type="datetime-local"
            min={minDateTime}
          />
        </Field>

        <Field label="Durata ședinței" error={errors.duration_minutes?.message}>
          <select
            {...register("duration_minutes")}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Se verifică disponibilitatea…
          </>
        ) : (
          "Confirmă programarea"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
