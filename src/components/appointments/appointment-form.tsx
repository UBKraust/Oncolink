"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    location_tag: string;
    personal_notes: string;
    reminders_enabled: boolean;
    reminder_minutes: number;
    meet_link: string;
  }>;
  submitLabel: string;
  cancelHref: string;
  /** When true, show the recurring appointment section */
  showRecurring?: boolean;
}

const initialState: AppointmentFormState = { error: null, fieldErrors: {} };

export function AppointmentForm({
  action,
  clients,
  defaults = {},
  submitLabel,
  cancelHref,
  showRecurring = false,
}: AppointmentFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [location, setLocation] = useState(defaults.location ?? "PRIVAT");
  const [recurring, setRecurring] = useState(false);
  const [recurringCount, setRecurringCount] = useState("8");
  const globalErrorId = state.error ? "appointment-form-error" : undefined;

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          id="appointment-form-error"
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
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
            aria-describedby={
              state.fieldErrors.client_id
                ? "client_id-error"
                : globalErrorId
            }
          >
            <option value="">— Selectează client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name ?? c.email ?? c.id}
              </option>
            ))}
          </Select>
          {state.fieldErrors.client_id && (
            <p id="client_id-error" className="text-xs text-rose-600">{state.fieldErrors.client_id}</p>
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
            aria-describedby={
              state.fieldErrors.appointment_date
                ? "appointment_date-error"
                : globalErrorId
            }
          />
          {state.fieldErrors.appointment_date && (
            <p id="appointment_date-error" className="text-xs text-rose-600">
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

        {/* Location Tag */}
        <div className="space-y-1.5">
          <Label htmlFor="location_tag">Etichetă Locație</Label>
          <Select
            id="location_tag"
            name="location_tag"
            defaultValue={defaults.location_tag ?? ""}
          >
            <option value="">— Fără etichetă —</option>
            <option value="#cabinet">#cabinet</option>
            <option value="#Clinica">#Clinica</option>
          </Select>
        </div>

        {/* Location (Internal Helper) */}
        <div className="space-y-1.5">
          <Label htmlFor="location">Tip Locație (Derivat)</Label>
          <Select
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {LOCATIONS.filter(l => !["CABINET", "CLINICA"].includes(l)).map((l) => (
              <option key={l} value={l}>
                {locationLabel[l]}
              </option>
            ))}
          </Select>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Notă: Eticheta (ex: #cabinet) are prioritate vizuală în calendar.
          </p>
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
            aria-describedby={
              location !== "ONLINE"
                ? "meet_link-hint"
                : state.fieldErrors.meet_link
                  ? "meet_link-error"
                  : globalErrorId
            }
          />
          {location !== "ONLINE" ? (
            <p id="meet_link-hint" className="text-xs text-muted-foreground">
              Completat automat pentru sesiuni Online.
            </p>
          ) : state.fieldErrors.meet_link ? (
            <p id="meet_link-error" className="text-xs text-rose-600">{state.fieldErrors.meet_link}</p>
          ) : null}
        </div>
      </div>

      {/* Personal Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="personal_notes">Note Personale (Private)</Label>
        <Textarea
          id="personal_notes"
          name="personal_notes"
          placeholder="Note despre această ședință, vizibile doar pentru tine..."
          defaultValue={defaults.personal_notes ?? ""}
          aria-describedby="personal_notes-hint"
        />
        <p id="personal_notes-hint" className="text-[10px] text-muted-foreground italic">
          Aceste note **NU** sunt partajate cu Google Calendar sau cu clientul.
        </p>
      </div>

      {/* Reminders Configuration */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <label htmlFor="reminders_enabled" className="flex cursor-pointer items-center gap-2.5">
          <Checkbox
            id="reminders_enabled"
            type="checkbox"
            name="reminders_enabled"
            value="true"
            defaultChecked={defaults.reminders_enabled ?? true}
          />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Bell className="h-4 w-4 text-primary" />
            Activează mementouri (Personal)
          </span>
        </label>
        
        <div className="pl-6.5 space-y-1.5">
          <Label htmlFor="reminder_minutes" className="text-xs text-muted-foreground">Anunță-mă cu:</Label>
          <Select
            id="reminder_minutes"
            name="reminder_minutes"
            defaultValue={String(defaults.reminder_minutes ?? 60)}
          >
            <option value="15">15 minute înainte</option>
            <option value="30">30 minute înainte</option>
            <option value="60">1 oră înainte</option>
            <option value="120">2 ore înainte</option>
            <option value="1440">24 ore înainte</option>
          </Select>
          <p className="text-[10px] text-muted-foreground italic">
            Notificare Google Calendar (Popup/Mobile).
          </p>
        </div>
      </div>

      {/* Recurring — shown only on new appointment */}
      {showRecurring && (
        <div className="rounded-lg border p-4 space-y-3">
          <label htmlFor="recurring" className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              id="recurring"
              type="checkbox"
              name="recurring"
              value="true"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Programare recurentă (generează automat)
            </span>
          </label>

          {recurring && (
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="recurring_frequency">Frecvență</Label>
                <Select
                  id="recurring_frequency"
                  name="recurring_frequency"
                  defaultValue="weekly"
                >
                  <option value="weekly">Săptămânal (la 7 zile)</option>
                  <option value="biweekly">Bilunar (la 14 zile)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recurring_count">Număr total ședințe</Label>
                <Select
                  id="recurring_count"
                  name="recurring_count"
                  value={recurringCount}
                  onChange={(e) => setRecurringCount(e.target.value)}
                >
                  {[4, 8, 12, 16, 24].map((n) => (
                    <option key={n} value={n}>
                      {n} ședințe
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Se va crea prima ședință + cele recurente automat, toate cu
                status <strong>Programat</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Anulează</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Se salvează…"
            : recurring
              ? `Creează ${recurringCount} ședințe`
              : submitLabel}
        </Button>
      </div>
    </form>
  );
}
