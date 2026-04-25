"use client";

import React from "react";
import {
  User, Mail, Phone, MapPin, Building, Baby, CreditCard,
  Share2, AlertTriangle, RefreshCw, BarChart2,
  Send, Briefcase, ExternalLink,
} from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PersonalInfoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  anonymized: boolean;
}

const SESSION_FREQ_LABELS: Record<string, string> = {
  SAPTAMANAL: "Săptămânal",
  BILUNAR: "Bilunar",
  LUNAR: "Lunar",
  OCAZIONAL: "Ocazional",
};
const REPORT_FREQ_LABELS: Record<string, string> = {
  LUNAR: "Lunar",
  LA_CERERE: "La cerere",
  NICIODATA: "Niciodată",
};
const REFERRAL_LABELS: Record<string, string> = {
  MEDIC: "Trimitere medic",
  FOST_PACIENT: "Recomandare fost pacient",
  INTERNET: "Internet / Google",
  SOCIAL_MEDIA: "Social media",
  ALTUL: "Altul",
};

export function PersonalInfoOverlay({ isOpen, onClose, client, anonymized }: PersonalInfoOverlayProps) {
  const isMinor = client.is_minor ?? false;
  const isB2B = client.billing_type === "B2B_COMPANY";

  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Profil & Contact"
      subtitle="Informații Identificare și Configurare"
      icon={User}
    >
      <div className="space-y-8">

        {/* ── Date Contact ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionTitle>Date Contact</SectionTitle>
          <div className="grid gap-2">
            <InfoBox
              icon={Mail}
              label="Email"
              value={anonymized ? "REDACTED" : client.email}
              href={anonymized || !client.email ? undefined : `mailto:${client.email}`}
            />
            <InfoBox
              icon={Phone}
              label="Telefon"
              value={anonymized ? "REDACTED" : client.phone}
              href={anonymized || !client.phone ? undefined : `tel:${client.phone}`}
            />
            <InfoBox
              icon={MapPin}
              label="Adresă Domiciliu"
              value={client.address}
            />
          </div>
        </section>

        {/* ── Identificare ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionTitle>Identificare</SectionTitle>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            {isMinor ? (
              <>
                <Row label="CNP minor" value={client.minor_cnp} mono />
                <Row label="CNP / CIF reprezentant legal" value={client.cnp_cif} mono />
              </>
            ) : (
              <Row label="CNP / CIF" value={client.cnp_cif} mono />
            )}
            <Row
              label="Status GDPR"
              value={
                client.gdpr_consent_signed ? (
                  <Badge variant="success" className="text-[10px]">Semnat</Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">Nesemnat</Badge>
                )
              }
            />
            {client.terms_consent_signed_at && (
              <Row
                label="Termeni acceptați"
                value={new Date(client.terms_consent_signed_at).toLocaleString("ro-RO")}
              />
            )}
            {client.legal_liability_consent_signed_at && (
              <Row
                label="Asumare legală"
                value={new Date(client.legal_liability_consent_signed_at).toLocaleString("ro-RO")}
              />
            )}
            {client.contract_url && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Contract</span>
                <a
                  href={client.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Deschide document
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Configurare Terapeutică ────────────────────────────────── */}
        <section className="space-y-3">
          <SectionTitle>Configurare Terapeutică</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Building}
              label="Locație"
              value={client.location === "CLINICA" ? "Clinică" : "Cabinet"}
            />
            <StatCard
              icon={CreditCard}
              label="Onorariu"
              value={client.session_price ? `${client.session_price} RON` : "—"}
            />
            <StatCard
              icon={RefreshCw}
              label="Frecvență"
              value={SESSION_FREQ_LABELS[client.session_frequency ?? ""] ?? "—"}
            />
            <StatCard
              icon={BarChart2}
              label="Rapoarte"
              value={REPORT_FREQ_LABELS[client.report_frequency ?? ""] ?? "—"}
            />
          </div>
          {client.send_report_to_parent && (
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
              <Send className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold text-indigo-700">Rapoartele se trimit și părintelui</span>
            </div>
          )}
        </section>

        {/* ── Facturare ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionTitle>Facturare</SectionTitle>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <Row
              label="Tip facturare"
              value={
                isB2B ? (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    B2B / Companie
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Persoană fizică</Badge>
                )
              }
            />
            {isB2B && client.company_name && (
              <Row label="Companie" value={client.company_name} icon={Briefcase} />
            )}
          </div>
        </section>

        {/* ── Contact Urgență ───────────────────────────────────────────── */}
        {(client.emergency_contact_name || client.emergency_contact_phone) && (
          <section className="space-y-3">
            <SectionTitle>Contact Urgență</SectionTitle>
            <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-4 space-y-3">
              <Row label="Nume" value={anonymized ? "REDACTED" : client.emergency_contact_name} icon={AlertTriangle} />
              <Row
                label="Telefon"
                value={anonymized ? "REDACTED" : client.emergency_contact_phone}
                href={anonymized || !client.emergency_contact_phone ? undefined : `tel:${client.emergency_contact_phone}`}
              />
              {client.emergency_contact_relation && (
                <Row label="Relație" value={client.emergency_contact_relation} />
              )}
            </div>
          </section>
        )}

        {/* ── Sursă Trimitere ──────────────────────────────────────────── */}
        {client.referral_source && (
          <section className="space-y-3">
            <SectionTitle>Sursă Trimitere</SectionTitle>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
              <Row
                label="Cum a ajuns la cabinet"
                value={REFERRAL_LABELS[client.referral_source] ?? client.referral_source}
                icon={Share2}
              />
              {client.referred_by_name && (
                <Row label="Recomandat de" value={client.referred_by_name} />
              )}
            </div>
          </section>
        )}

        {/* ── Tutore / Minor ────────────────────────────────────────────── */}
        {isMinor && (
          <section className="space-y-3">
            <SectionTitle>Tutore Legal</SectionTitle>
            <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-3">
              <Row label="Părinte / Tutore" value={client.parent_name} icon={Baby} />
              {client.parent_phone && (
                <Row
                  label="Telefon Tutore"
                  value={anonymized ? "REDACTED" : client.parent_phone}
                  href={anonymized || !client.parent_phone ? undefined : `tel:${client.parent_phone}`}
                />
              )}
              {client.parent_2_name && (
                <Row label="Tutore 2" value={client.parent_2_name} />
              )}
              {client.parent_2_phone && (
                <Row
                  label="Telefon Tutore 2"
                  value={anonymized ? "REDACTED" : client.parent_2_phone}
                  href={anonymized || !client.parent_2_phone ? undefined : `tel:${client.parent_2_phone}`}
                />
              )}
              {client.parents_marital_status && (
                <Row label="Status Marital Părinți" value={formatMaritalStatus(client.parents_marital_status)} />
              )}
            </div>
          </section>
        )}

      </div>
    </SectionDetailOverlay>
  );
}

function formatMaritalStatus(v: string) {
  const map: Record<string, string> = {
    CASATORITI: "Căsătoriți",
    DIVORTATI_CUSTODIE_COMUNA: "Divorțați — custodie comună",
    DIVORTATI_CUSTODIE_EXCLUSIVA: "Divorțați — custodie exclusivă",
    ALTUL: "Alt statut",
  };
  return map[v] ?? v;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-100">
      {children}
    </h3>
  );
}

function Row({
  label,
  value,
  icon: Icon,
  href,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: any;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tight shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className={cn(
        "text-sm font-bold text-slate-800 text-right",
        mono && "font-mono",
        href && "text-primary hover:underline"
      )}>
        {value ?? "—"}
      </span>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return <div>{content}</div>;
}

function InfoBox({ icon: Icon, label, value, href }: {
  icon: any;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 group-hover:text-primary transition-colors shadow-sm shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );

  if (href) return <a href={href}>{inner}</a>;
  return inner;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-slate-800">{value}</span>
      </div>
    </div>
  );
}
