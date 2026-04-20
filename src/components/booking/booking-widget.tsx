"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarCheck, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Slot {
  start: string;
  end: string;
}

type Step = "slot" | "details" | "done";

export function BookingWidget() {
  const [step, setStep] = useState<Step>("slot");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/book")
      .then((r) => r.json())
      .then((d: { slots?: Slot[] }) => setSlots(d.slots ?? []))
      .catch(() => setError("Nu am putut încărca orarul disponibil."))
      .finally(() => setLoadingSlots(false));
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      slotStart: selectedSlot.start,
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      cnp_cif: fd.get("cnp_cif"),
      address: fd.get("address"),
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare la programare.");
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">Programare înregistrată!</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Vei primi o confirmare în scurt timp. Terapeutul tău va valida
            programarea.
          </p>
          {selectedSlot && (
            <p className="text-sm font-medium">
              {format(new Date(selectedSlot.start), "EEEE, d MMMM yyyy · HH:mm", {
                locale: ro,
              })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "details" && selectedSlot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datele tale</CardTitle>
          <CardDescription>
            Ședință:{" "}
            {format(new Date(selectedSlot.start), "EEEE, d MMMM yyyy · HH:mm", {
              locale: ro,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nume complet *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+40 7xx xxx xxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnp_cif">CNP / CIF</Label>
              <Input id="cnp_cif" name="cnp_cif" placeholder="1234567890123" />
              <p className="text-xs text-muted-foreground">
                Necesar pentru emiterea facturii fiscale.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresă</Label>
              <Input id="address" name="address" placeholder="Str. Exemplu 1, Cluj-Napoca" />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("slot")}
              >
                Înapoi
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Confirmă programarea
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Step: slot selection
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alege un interval</CardTitle>
        <CardDescription>
          Ședință 50 min · Cabinet psihoterapie
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nu există sloturi disponibile în următoarele 14 zile.
          </p>
        ) : (
          <SlotGrid
            slots={slots}
            selected={selectedSlot}
            onSelect={setSelectedSlot}
          />
        )}

        <Button
          className="mt-6 w-full"
          disabled={!selectedSlot}
          onClick={() => setStep("details")}
        >
          Continuă
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function SlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[];
  selected: Slot | null;
  onSelect: (s: Slot) => void;
}) {
  // Group by date
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = format(new Date(s.start), "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
      {Array.from(byDay.entries()).map(([dateKey, daySlots]) => (
        <div key={dateKey}>
          <p className="mb-2 text-xs font-semibold capitalize text-muted-foreground">
            {format(new Date(dateKey), "EEEE, d MMMM", { locale: ro })}
          </p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((s) => {
              const isSelected = selected?.start === s.start;
              return (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => onSelect(s)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:border-primary/60 hover:bg-accent"
                  }`}
                >
                  {format(new Date(s.start), "HH:mm")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
