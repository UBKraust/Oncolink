"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Baby, 
  Building, 
  MapPin, 
  ShieldCheck, 
  ShieldOff, 
  ChevronRight,
  Filter,
  Users,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { deriveClientLifecycle } from "@/lib/clients/lifecycle";
import type { ClientWithLifecycleRow } from "@/lib/clients/queries";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { initialsFromName } from "@/lib/clients/validation";
import { cn } from "@/lib/utils";
import { ClientDetailOverlay } from "./ClientDetailOverlay";
import { ContractGeneratorModal } from "./ContractGeneratorModal";
import Link from "next/link";

interface ClientsClientProps {
  initialClients: ClientWithLifecycleRow[];
}

export function ClientsClient({ initialClients }: ClientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contractClientId, setContractClientId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return initialClients;
    const q = searchQuery.toLowerCase();
    return initialClients.filter(c => 
      c.full_name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q) || 
      c.cnp_cif?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [initialClients, searchQuery]);

  const selectedClient = useMemo(() => 
    initialClients.find(c => c.id === selectedClientId) || null
  , [initialClients, selectedClientId]);

  const contractClient = useMemo(() => 
    initialClients.find(c => c.id === contractClientId) || null
  , [initialClients, contractClientId]);

  const activeFiltersLabel = searchQuery
    ? `Filtrare activă: ${filteredClients.length} rezultat${filteredClients.length === 1 ? "" : "e"}`
    : `${initialClients.length} pacienți în registru`;

  function openClient(clientId: string) {
    setSelectedClientId(clientId);
  }

  function handleRowKeyDown(
    event: React.KeyboardEvent<HTMLTableRowElement>,
    clientId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openClient(clientId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Caută în baza de date pacienți..." 
            className="h-11 rounded-2xl border-border/60 bg-muted/40 pl-10 font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <Badge variant="secondary" className="h-11 rounded-2xl px-4 text-xs font-bold">
              <Filter className="mr-2 h-4 w-4" /> {activeFiltersLabel}
           </Badge>
           <Button asChild className="h-11 gap-2 rounded-2xl px-6 font-black shadow-sm">
             <Link href="/dashboard/clients/new">
                <Plus className="h-5 w-5" /> Adaugă Client
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {filteredClients.length === 0 ? (
          <div className="rounded-[1.75rem] border border-border/60 bg-card px-6 py-12 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20" />
              <p className="font-medium">Nu am găsit niciun client cu acest nume.</p>
            </div>
          </div>
        ) : (
          filteredClients.map((client) => {
            const anonymized = !!client.notes_anonymized_at;
            const lifecycle = deriveClientLifecycle(client, client.appointments ?? []);
            return (
              <article
                key={client.id}
                className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-xs font-black text-foreground">
                    {initialsFromName(client.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{client.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {anonymized ? "REDACTED@cepaipatit.ro" : client.email || "fără email"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={lifecycle.badgeVariant}>
                    {lifecycle.label}
                  </Badge>
                  {client.is_minor && (
                    <Badge variant="warning">
                      <Baby className="mr-1 h-3 w-3" /> Minor
                    </Badge>
                  )}
                  {client.billing_type === "B2B_COMPANY" && (
                    <Badge variant="info">
                      <Building className="mr-1 h-3 w-3" /> B2B
                    </Badge>
                  )}
                  <Badge variant={client.gdpr_consent_signed ? "success" : "warning"}>
                    {client.gdpr_consent_signed ? (
                      <ShieldCheck className="mr-1 h-3 w-3" />
                    ) : (
                      <ShieldOff className="mr-1 h-3 w-3" />
                    )}
                    {client.gdpr_consent_signed ? "GDPR semnat" : "GDPR lipsă"}
                  </Badge>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {lifecycle.nextActions[0] ?? lifecycle.summary}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 text-xs">
                  <div>
                    <p className="font-black uppercase tracking-widest text-muted-foreground">Locație</p>
                    <p className="mt-1 flex items-center gap-1 font-medium text-foreground/80">
                      <MapPin className="h-3 w-3" />
                      {client.location === "CLINICA" ? "Clinică" : "Cabinet"}
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-muted-foreground">Vechime</p>
                    <p className="mt-1 font-medium text-foreground/80">
                      {format(new Date(client.created_at), "MMM yyyy", { locale: ro })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {!anonymized && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      onClick={() => setContractClientId(client.id)}
                    >
                      <FileCheck className="h-4 w-4" />
                      Contract
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="flex-1 rounded-2xl"
                    onClick={() => openClient(client.id)}
                  >
                    Deschide fișa
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modern Dense Table */}
      <div className="hidden overflow-x-auto rounded-[1.75rem] border border-border/60 bg-card shadow-sm md:block">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-border/70 hover:bg-transparent">
              <TableHead className="w-[300px] py-4 pl-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informații Pacient</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status & Profil</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal (GDPR)</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vechime</TableHead>
              <TableHead className="pr-8 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fișă</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Users className="h-12 w-12 opacity-20" />
                      <p className="font-medium">Nu am găsit niciun client cu acest nume.</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const anonymized = !!client.notes_anonymized_at;
                const lifecycle = deriveClientLifecycle(client, client.appointments ?? []);
                return (
                  <TableRow 
                    key={client.id} 
                    className="group cursor-pointer border-b-border/50 transition-all hover:bg-muted/30 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={() => openClient(client.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, client.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Deschide fișa pentru ${client.full_name ?? "client"}`}
                  >
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xs font-black text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          {initialsFromName(client.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                            {client.full_name}
                          </p>
                          <p className="truncate text-[11px] font-medium text-muted-foreground">
                            {anonymized ? "REDACTED@cepaipatit.ro" : client.email || "fără email"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={lifecycle.badgeVariant}>
                            {lifecycle.label}
                          </Badge>
                          {client.is_minor && (
                            <Badge variant="warning" className="h-6 rounded-lg px-2 py-0.5 text-[9px] tracking-wider">
                              <Baby className="mr-1 h-3 w-3" /> Minor
                            </Badge>
                          )}
                          {client.billing_type === "B2B_COMPANY" && (
                            <Badge variant="info" className="h-6 rounded-lg px-2 py-0.5 text-[9px] tracking-wider">
                              <Building className="mr-1 h-3 w-3" /> B2B
                            </Badge>
                          )}
                        </div>
                        <p className="max-w-xs text-[11px] font-medium leading-relaxed text-muted-foreground">
                          {lifecycle.nextActions[0] ?? lifecycle.summary}
                        </p>
                        <span className="inline-flex items-center gap-1 px-1 text-[10px] font-bold text-muted-foreground">
                          <MapPin className="h-3 w-3" /> 
                          {client.location === "CLINICA" ? "Clinică" : "Cabinet"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={client.gdpr_consent_signed ? "success" : "warning"}
                          className={cn(
                            "h-7 px-3 tracking-tight",
                            !client.gdpr_consent_signed && "animate-pulse-subtle",
                          )}
                        >
                          {client.gdpr_consent_signed ? (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          ) : (
                            <ShieldOff className="mr-1 h-3 w-3" />
                          )}
                          {client.gdpr_consent_signed ? "Semnat" : "Lipsă"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground/80">
                             {format(new Date(client.created_at), "MMM yyyy", { locale: ro })}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">înregistrat</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2">
                         {!anonymized && (
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
                             onClick={(e) => {
                               e.stopPropagation();
                               setContractClientId(client.id);
                             }}
                             title="Generează Contract"
                           >
                              <FileCheck className="h-5 w-5" />
                           </Button>
                         )}
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-9 w-9 rounded-xl text-muted-foreground transition-all group-hover:bg-primary/5 group-hover:text-primary"
                           onClick={(e) => {
                             e.stopPropagation();
                             openClient(client.id);
                           }}
                           aria-label={`Deschide fișa pentru ${client.full_name ?? "client"}`}
                         >
                            <ChevronRight className="h-5 w-5" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Overlay */}
      <ClientDetailOverlay 
        client={selectedClient} 
        onClose={() => setSelectedClientId(null)} 
      />

      {/* Contract Modal */}
      <ContractGeneratorModal
        isOpen={!!contractClientId}
        onClose={() => setContractClientId(null)}
        client={contractClient}
      />
    </div>
  );
}
