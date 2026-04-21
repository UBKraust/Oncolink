"use client";

import React from "react";
import { User, Mail, Phone, MapPin, Building, Baby, ShieldCheck, ShieldAlert, CreditCard } from "lucide-react";
import { SectionDetailOverlay } from "./SectionDetailOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PersonalInfoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  anonymized: boolean;
}

export function PersonalInfoOverlay({ isOpen, onClose, client, anonymized }: PersonalInfoOverlayProps) {
  return (
    <SectionDetailOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Profil & Contact"
      subtitle="Informații Identificare și Localizare"
      icon={User}
    >
      <div className="space-y-8">
        {/* Contact info */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Contact</h3>
          <div className="grid gap-3">
            <InfoBox icon={Mail} label="Email principal" value={anonymized ? "REDACTED" : client.email} />
            <InfoBox icon={Phone} label="Telefon mobil" value={anonymized ? "REDACTED" : client.phone} />
            <InfoBox icon={MapPin} label="Adresă Domiciliu" value={client.address} />
          </div>
        </section>

        {/* Identification */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identificare Fiscală</h3>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">CNP / CIF</span>
              <span className="font-mono text-sm font-black text-slate-800">{client.cnp_cif || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex-1 h-1.5 rounded-full",
                client.cnp_cif ? "bg-emerald-400" : "bg-slate-200"
              )} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Valificat</span>
            </div>
          </div>
        </section>

        {/* Profile Details */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profil Terapeutic</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Locație</p>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-slate-800">
                  {client.location === "CLINICA" ? "Clinică" : "Cabinet"}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ononariu</p>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-slate-800">
                  {client.session_price ? `${client.session_price} RON` : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Minor Info if applicable */}
        {client.is_minor && (
          <section className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-indigo-900 uppercase tracking-tight">
              <Baby className="h-5 w-5" /> Detalii Minor
            </div>
            <div className="grid gap-3">
              <div className="flex justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs text-indigo-600 font-medium tracking-tight">Părinte</span>
                <span className="text-sm font-black text-indigo-900">{client.parent_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-indigo-600 font-medium tracking-tight">Status Marital</span>
                <span className="text-sm font-black text-indigo-900">{client.parents_marital_status || "Nesalvat"}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </SectionDetailOverlay>
  );
}

function InfoBox({ icon: Icon, label, value }: { icon: any, label: string, value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 group-hover:text-primary transition-colors shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
