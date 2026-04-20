"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AppointmentFormState } from "@/lib/appointments/form-state";
import {
  APPOINTMENT_STATUSES,
  LOCATIONS,
  locationLabel,
  statusLabel,
  toDatetimeLocalValue,
} from "@/lib/appointments/helpers";
import type { ClientRow } from "@/lib/clients/queries";

interface AppointmentFormProps {
  action: (
    state: AppointmentFormState,
    formData: FormData,
  ) => Promise<AppointmentFormState>;
  clients: Pick<ClientRow, "id" | "full_name" | "email">[];
  defaults?: Partial<{
    client_id: string;
    appointment_date: string;
    duration_minutes: number;
    status: string;
    location: string;
    meet_link: string;
  }>;
  submitLabel: string;
  cancelHref: string;
}

const initialState: AppointmentFormState = { error: null, fieldErrors: {} };

export function AppointmentForm({
  action,
  clients,
  defaults = {},
  submitLabel,
  cancelHref,
}: AppointmentFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [location, setLocation] = useState(defaults.location ?? "PRIVAT");

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Client */}
        <div className="space-y-1.5">
          <Label htmlFor="client_id">
            Client <span className="text-rose-600">*</span>
          </Label>
          <Select
            id="client_id"
            name="client_id"
            required
            defaultValue={defaults.client_id ?? ""}
            aria-invalid={!!state.fieldErrors.client_id}
          >
            <option value="">— Selectează client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name ?? c.email ?? c.id}
              </option>
            ))}
          </Select>
          {state.fieldErrors.client_id && (
            <p className="text-xs text-rose-600">{state.fieldErrors.client_id}</p>
          )}
        </div>

        {/* Date-time */}
        <div className="space-y-1.5">
          <Label htmlFor="appointment_date">
            Dată și oră <span className="text-rose-600">*</span>
          </Label>
          <Input
            id="appointment_date"
            name="appointment_date"
            type="datetime-local"
            required
            defaultValue={
              defaults.appointment_date
                ? toDatetimeLocalValue(defaults.appointment_date)
                : ""
            }
            aria-invalid={!!state.fieldErrors.appointment_date}
          />
          {state.fieldErrors.appointment_date && (
            <p className="text-xs text-rose-600">
              {state.fieldErrors.appointment_date}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label htmlFor="duration_minutes">Durată (minute)</Label>
          <Select
            id="duration_minutes"
            name="duration_minutes"
            defaultValue={String(defaults.duration_minutes ?? 50)}
          >
            {[25, 50, 60, 90, 120, 180, 240].map((d) => (
              <option key={d} value={d}>
                {d} min{d === 50 ? " (standard)" : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "PROGRAMAT"}
          >
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location">Locație</Label>
          <Select
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {locationLabel[l]}
              </option>
            ))}
          </Select>
        </div>

        {/* Meet link (shown only when ONLINE) */}
        <div className="space-y-1.5">
          <Label htmlFor="meet_link">
            Link Google Meet{location === "ONLINE" && (
              <span className="ml-0.5 text-rose-600">*</span>
            )}
          </Label>
          <Input
            id="meet_link"
            name="meet_link"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            defaultValue={defaults.meet_link ?? ""}
            disabled={location !== "ONLINE"}
            aria-invalid={!!state.fieldErrors.meet_link}
          />
          {location !== "ONLINE" ? (
            <p className="text-xs text-muted-foreground">
              Completat automat pentru sesiuni Online.
            </p>
          ) : state.fieldErrors.meet_link ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.meet_link}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Anulează</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Se salvează…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
