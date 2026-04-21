"use client";

import { useState, useTransition } from "react";
import {
  Shield, Smartphone, Globe, UserCircle, KeyRound, CheckCircle2,
  Lock, Hospital, Clock, Euro, Plus, Trash2, AlertCircle, Calendar,
  ArrowRight, History,
} from "lucide-react";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import type { TherapistSettings, WorkSchedule, WorkDaySchedule } from "@/app/dashboard/settings/settings-actions";
import {
  updateProfileSettings,
  updatePricingSettings,
  updateScheduleSettings,
  updateIntegrationsSettings,
  updateCasSettings,
  updatePinSettings,
} from "@/app/dashboard/settings/settings-actions";

const DAYS: { key: keyof WorkSchedule; label: string }[] = [
  { key: "monday",    label: "Luni" },
  { key: "tuesday",   label: "Marți" },
  { key: "wednesday", label: "Miercuri" },
  { key: "thursday",  label: "Joi" },
  { key: "friday",    label: "Vineri" },
  { key: "saturday",  label: "Sâmbătă" },
  { key: "sunday",    label: "Duminică" },
];

function SaveFeedback({ saved, error }: { saved: boolean; error: string | null }) {
  if (error) return (
    <span className="flex items-center gap-1.5 text-sm text-rose-600">
      <AlertCircle className="h-4 w-4" /> {error}
    </span>
  );
  if (saved) return (
    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
      <CheckCircle2 className="h-4 w-4" /> Salvat
    </span>
  );
  return null;
}

// ─── Tab: Profil ─────────────────────────────────────────────────────────────

function ProfileTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: s.full_name ?? "",
    cif: s.cif ?? "",
    cpr_code: s.cpr_code ?? "",
    iban: s.iban ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    start(async () => {
      const res = await updateProfileSettings(form);
      if (res.success) setSaved(true);
      else setError(res.error ?? "Eroare");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Date Identificare Terapeut
          </CardTitle>
          <CardDescription>Informațiile care vor apărea pe documentele emise (inclusiv facturi).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="full_name">Nume Complet Titular</Label>
              <Input id="full_name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="ex: Dr. Ioana Popescu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpr_code">Cod Parafă (CPR)</Label>
              <Input id="cpr_code" value={form.cpr_code} onChange={e => setForm(f => ({ ...f, cpr_code: e.target.value }))} placeholder="ex: 123456" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cif">CIF / CUI Cabinet</Label>
              <Input id="cif" value={form.cif} onChange={e => setForm(f => ({ ...f, cif: e.target.value }))} placeholder="ex: 42880000" className="font-mono" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="iban">Cont IBAN</Label>
              <Input id="iban" value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="RO89XXXX0000000000000000" className="font-mono uppercase" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex items-center gap-4">
          <Button disabled={isPending}>{isPending ? "Se salvează…" : "Salvează Profilul"}</Button>
          <SaveFeedback saved={saved} error={error} />
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── Tab: Tarife ──────────────────────────────────────────────────────────────

function PricingTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionTypes, setSessionTypes] = useState<{ name: string; price: number }[]>(
    Object.entries(s.session_types_pricing).map(([name, price]) => ({ name, price }))
  );
  const [defaultDuration, setDefaultDuration] = useState(s.default_session_duration_minutes);

  function addRow() {
    setSessionTypes(p => [...p, { name: "", price: 250 }]);
  }
  function removeRow(i: number) {
    setSessionTypes(p => p.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, field: "name" | "price", value: string | number) {
    setSessionTypes(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    const pricing: Record<string, number> = {};
    for (const row of sessionTypes) {
      if (row.name.trim()) pricing[row.name.trim()] = row.price;
    }
    const defaultPrice = sessionTypes[0]?.price ?? 250;
    start(async () => {
      const res = await updatePricingSettings({
        session_types_pricing: pricing,
        default_session_price: defaultPrice,
        default_session_duration_minutes: defaultDuration,
      });
      if (res.success) setSaved(true);
      else setError(res.error ?? "Eroare");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            Catalog Tarife
          </CardTitle>
          <CardDescription>Configurează tipurile de ședințe și prețul lor implicit (RON).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {sessionTypes.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={row.name}
                  onChange={e => updateRow(i, "name", e.target.value)}
                  placeholder="Tip ședință"
                  className="flex-1"
                />
                <div className="flex items-center gap-1.5 w-36 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    value={row.price}
                    onChange={e => updateRow(i, "price", Number(e.target.value))}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">RON</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => removeRow(i)}
                  disabled={sessionTypes.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adaugă Tarif
          </Button>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label htmlFor="duration" className="shrink-0">Durată implicită ședință</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={180}
              step={5}
              value={defaultDuration}
              onChange={e => setDefaultDuration(Number(e.target.value))}
              className="w-24 font-mono"
            />
            <span className="text-sm text-muted-foreground">minute</span>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex items-center gap-4">
          <Button disabled={isPending}>{isPending ? "Se salvează…" : "Salvează Tarifele"}</Button>
          <SaveFeedback saved={saved} error={error} />
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── Tab: Orar ────────────────────────────────────────────────────────────────

function ScheduleTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultSchedule = s.work_schedule ?? {
    monday:    { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
    tuesday:   { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
    wednesday: { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
    thursday:  { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
    friday:    { enabled: true,  start: "09:00", end: "17:00", break_start: "13:00", break_end: "14:00" },
    saturday:  { enabled: false, start: "10:00", end: "14:00", break_start: null,    break_end: null    },
    sunday:    { enabled: false, start: "10:00", end: "14:00", break_start: null,    break_end: null    },
  };

  const [schedule, setSchedule] = useState<WorkSchedule>(defaultSchedule as WorkSchedule);

  function updateDay(key: keyof WorkSchedule, patch: Partial<WorkDaySchedule>) {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    start(async () => {
      const res = await updateScheduleSettings(schedule);
      if (res.success) setSaved(true);
      else setError(res.error ?? "Eroare");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Program de Lucru
          </CardTitle>
          <CardDescription>
            Orarul este utilizat de calendar pentru a bloca sloturile indisponibile și a sugera
            programări în intervalele active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[100px_1fr] gap-3 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Zi</span>
              <span>Interval lucru / Pauză</span>
            </div>
            {DAYS.map(({ key, label }) => {
              const day = schedule[key];
              return (
                <div key={key} className={`grid grid-cols-[100px_1fr] gap-3 rounded-lg px-2 py-2.5 ${day.enabled ? "bg-muted/30" : "opacity-50"}`}>
                  {/* Toggle + label */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={e => updateDay(key, { enabled: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>

                  {/* Time inputs */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground w-12">Lucru</span>
                      <Input
                        type="time"
                        value={day.start}
                        onChange={e => updateDay(key, { start: e.target.value })}
                        disabled={!day.enabled}
                        className="h-8 w-28 font-mono text-sm"
                      />
                      <span className="text-muted-foreground text-xs">—</span>
                      <Input
                        type="time"
                        value={day.end}
                        onChange={e => updateDay(key, { end: e.target.value })}
                        disabled={!day.enabled}
                        className="h-8 w-28 font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground w-12">Pauză</span>
                      <Input
                        type="time"
                        value={day.break_start ?? ""}
                        onChange={e => updateDay(key, { break_start: e.target.value || null })}
                        disabled={!day.enabled}
                        placeholder="—"
                        className="h-8 w-28 font-mono text-sm"
                      />
                      <span className="text-muted-foreground text-xs">—</span>
                      <Input
                        type="time"
                        value={day.break_end ?? ""}
                        onChange={e => updateDay(key, { break_end: e.target.value || null })}
                        disabled={!day.enabled}
                        placeholder="—"
                        className="h-8 w-28 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex items-center gap-4">
          <Button disabled={isPending}>{isPending ? "Se salvează…" : "Salvează Orarul"}</Button>
          <SaveFeedback saved={saved} error={error} />
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── Tab: Integrări ───────────────────────────────────────────────────────────

function IntegrationsTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    smartbill_username: s.smartbill_username ?? "",
    smartbill_token: "",
    smartbill_cif: s.smartbill_cif ?? "",
    twilio_account_sid: s.twilio_account_sid ?? "",
    twilio_auth_token: "",
    twilio_phone_number: s.twilio_phone_number ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    const payload: Parameters<typeof updateIntegrationsSettings>[0] = {
      smartbill_username: form.smartbill_username,
      smartbill_cif: form.smartbill_cif,
      twilio_account_sid: form.twilio_account_sid,
      twilio_phone_number: form.twilio_phone_number,
    };
    if (form.smartbill_token) payload.smartbill_token = form.smartbill_token;
    if (form.twilio_auth_token) payload.twilio_auth_token = form.twilio_auth_token;

    start(async () => {
      const res = await updateIntegrationsSettings(payload);
      if (res.success) setSaved(true);
      else setError(res.error ?? "Eroare");
    });
  }

  const smartbillConnected = Boolean(s.smartbill_username);
  const twilioConnected = Boolean(s.twilio_account_sid);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google */}
      <Card>
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-red-500" />
                Google Workspace (Calendar & Drive)
              </CardTitle>
              <CardDescription className="mt-1">Acces pentru generare link-uri Meet și încărcare documente pe Drive.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="/api/google/auth">Conectează Cont Google</a>
          </Button>
        </CardContent>
      </Card>

      {/* SmartBill */}
      <Card>
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Facturare: SmartBill API
              </CardTitle>
              <CardDescription className="mt-1">Emitere automată de facturi și chitanțe.</CardDescription>
            </div>
            <Badge variant={smartbillConnected ? "success" : "secondary"} className="shrink-0">
              {smartbillConnected ? "Conectat" : "Neconfigurat"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Cont SmartBill</Label>
              <Input type="email" value={form.smartbill_username} onChange={e => setForm(f => ({ ...f, smartbill_username: e.target.value }))} placeholder="email@exemplu.ro" />
            </div>
            <div className="space-y-2">
              <Label>Cod CIF Facturare</Label>
              <Input value={form.smartbill_cif} onChange={e => setForm(f => ({ ...f, smartbill_cif: e.target.value }))} className="font-mono" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Token API {smartbillConnected && <span className="text-xs text-muted-foreground">(lasă gol pentru a păstra actualul)</span>}</Label>
              <Input type="password" value={form.smartbill_token} onChange={e => setForm(f => ({ ...f, smartbill_token: e.target.value }))} placeholder={smartbillConnected ? "••••••••••••••••" : "Token API SmartBill"} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Import Entry */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Migrare Date Istorice
          </CardTitle>
          <CardDescription className="text-xs">
            Ai lucrat deja în SmartBill? Importă facturile și cheltuielile din lunile trecute pentru a avea rapoarte financiare complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto gap-2">
            <Link href="/dashboard/settings/import">
              Deschide Importator CSV <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>


      {/* Twilio */}
      <Card>
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-500" />
                Notificări SMS: Twilio
              </CardTitle>
              <CardDescription className="mt-1">Alerte de programare trimise automat pacienților.</CardDescription>
            </div>
            <Badge variant={twilioConnected ? "success" : "secondary"} className="shrink-0">
              {twilioConnected ? "Conectat" : "Neconfigurat"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <Input value={form.twilio_account_sid} onChange={e => setForm(f => ({ ...f, twilio_account_sid: e.target.value }))} placeholder="ACxxxxxxxxxxxxx" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Auth Token {twilioConnected && <span className="text-xs text-muted-foreground">(lasă gol pentru a păstra actualul)</span>}</Label>
              <Input type="password" value={form.twilio_auth_token} onChange={e => setForm(f => ({ ...f, twilio_auth_token: e.target.value }))} placeholder={twilioConnected ? "••••••••••••••••" : "Auth Token"} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Număr Telefon Sender</Label>
              <Input value={form.twilio_phone_number} onChange={e => setForm(f => ({ ...f, twilio_phone_number: e.target.value }))} placeholder="+1234567890" className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button disabled={isPending}>{isPending ? "Se salvează…" : "Salvează Integrările"}</Button>
        <SaveFeedback saved={saved} error={error} />
      </div>
    </form>
  );
}

// ─── Tab: Securitate ──────────────────────────────────────────────────────────

function SecurityTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState({ current: "", next: "", confirm: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    if (pin.next.length < 4) { setError("PIN-ul trebuie să aibă minim 4 cifre."); return; }
    if (pin.next !== pin.confirm) { setError("PIN-urile noi nu coincid."); return; }
    start(async () => {
      const res = await updatePinSettings(pin.current, pin.next);
      if (res.success) { setSaved(true); setPin({ current: "", next: "", confirm: "" }); }
      else setError(res.error ?? "Eroare");
    });
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Shield className="h-5 w-5" />
          PIN Dosar Clinic
        </CardTitle>
        <CardDescription className="text-amber-700/80">
          Notițele clinice sunt protejate cu un PIN. Acesta este cerut la fiecare accesare.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 p-4 rounded-md bg-background border mb-6">
          <div className="p-2 bg-emerald-100 rounded-full shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{s.has_pin ? "PIN configurat" : "PIN neconfigurat"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {s.has_pin
                ? "Dosarul clinic este protejat. Completează formularul de mai jos pentru a schimba PIN-ul."
                : "Nu ai setat un PIN. Completează formularul pentru a activa protecția."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <h4 className="text-sm font-semibold flex gap-2 items-center">
            <KeyRound className="w-4 h-4" />
            {s.has_pin ? "Schimbă PIN-ul" : "Setează PIN"}
          </h4>
          {s.has_pin && (
            <div className="space-y-2">
              <Label>PIN Curent</Label>
              <Input
                type="password"
                value={pin.current}
                onChange={e => setPin(p => ({ ...p, current: e.target.value }))}
                placeholder="••••"
                maxLength={8}
                className="font-mono text-center tracking-[0.5em]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>PIN Nou</Label>
            <Input
              type="password"
              value={pin.next}
              onChange={e => setPin(p => ({ ...p, next: e.target.value }))}
              placeholder="••••"
              maxLength={8}
              className="font-mono text-center tracking-[0.5em]"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmă PIN Nou</Label>
            <Input
              type="password"
              value={pin.confirm}
              onChange={e => setPin(p => ({ ...p, confirm: e.target.value }))}
              placeholder="••••"
              maxLength={8}
              className="font-mono text-center tracking-[0.5em]"
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Button disabled={isPending} className="gap-2">
              <Lock className="w-4 h-4" />
              {isPending ? "Se actualizează…" : "Actualizează PIN"}
            </Button>
            <SaveFeedback saved={saved} error={error} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Tab: CAS ─────────────────────────────────────────────────────────────────

function CasTab({ s }: { s: TherapistSettings }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cas_active: s.cas_active,
    cas_contract_number: s.cas_contract_number ?? "",
    cas_county: s.cas_county ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setError(null);
    start(async () => {
      const res = await updateCasSettings(form);
      if (res.success) setSaved(true);
      else setError(res.error ?? "Eroare");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Hospital className="h-5 w-5" />
            Contract CAS — Servicii Conexe Psihologie
          </CardTitle>
          <CardDescription className="text-blue-700/80">
            Activează dacă ai contract activ cu Casa de Asigurări de Sănătate.
            Modulul afișează evidența ședințelor decontate și permite exportul CSV lunar pentru SIUI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 p-4 rounded-md bg-background border cursor-pointer hover:bg-muted/20 transition-colors">
            <input
              type="checkbox"
              checked={form.cas_active}
              onChange={e => setForm(f => ({ ...f, cas_active: e.target.checked }))}
              className="rounded h-4 w-4 accent-primary"
            />
            <div>
              <span className="font-medium text-sm">Contract CAS activ în cabinet</span>
              <p className="text-xs text-muted-foreground mt-0.5">Activează modulul de evidență și export SIUI</p>
            </div>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Număr Contract CAS</Label>
              <Input
                value={form.cas_contract_number}
                onChange={e => setForm(f => ({ ...f, cas_contract_number: e.target.value }))}
                placeholder="ex: 3456/2024"
                disabled={!form.cas_active}
              />
            </div>
            <div className="space-y-2">
              <Label>Județ / CAS</Label>
              <Input
                value={form.cas_county}
                onChange={e => setForm(f => ({ ...f, cas_county: e.target.value }))}
                placeholder="ex: B (București)"
                disabled={!form.cas_active}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex items-center gap-4 flex-wrap">
          <Button disabled={isPending}>{isPending ? "Se salvează…" : "Salvează Configurație CAS"}</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/cas">Deschide Modul CAS</Link>
          </Button>
          <SaveFeedback saved={saved} error={error} />
        </CardFooter>
      </Card>
    </form>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function SettingsClient({ settings }: { settings: TherapistSettings }) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-3 md:grid-cols-6 md:w-auto">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="pricing">Tarife</TabsTrigger>
        <TabsTrigger value="schedule">Orar</TabsTrigger>
        <TabsTrigger value="integrations">Integrări</TabsTrigger>
        <TabsTrigger value="security">Securitate</TabsTrigger>
        <TabsTrigger value="cas">CAS</TabsTrigger>
      </TabsList>

      <TabsContent value="profile"      className="animate-in fade-in duration-300"><ProfileTab      s={settings} /></TabsContent>
      <TabsContent value="pricing"      className="animate-in fade-in duration-300"><PricingTab      s={settings} /></TabsContent>
      <TabsContent value="schedule"     className="animate-in fade-in duration-300"><ScheduleTab     s={settings} /></TabsContent>
      <TabsContent value="integrations" className="animate-in fade-in duration-300"><IntegrationsTab s={settings} /></TabsContent>
      <TabsContent value="security"     className="animate-in fade-in duration-300"><SecurityTab     s={settings} /></TabsContent>
      <TabsContent value="cas"          className="animate-in fade-in duration-300"><CasTab          s={settings} /></TabsContent>
    </Tabs>
  );
}
