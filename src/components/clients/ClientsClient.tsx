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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { initialsFromName } from "@/lib/clients/validation";
import { ClientDetailOverlay } from "./ClientDetailOverlay";
import { ContractGeneratorModal } from "./ContractGeneratorModal";
import type { ClientProfile } from "./types";
import Link from "next/link";

interface ClientsClientProps {
  initialClients: ClientProfile[];
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
      c.cnp_cif?.toLowerCase().includes(q)
    );
  }, [initialClients, searchQuery]);

  const selectedClient = useMemo(() => 
    initialClients.find(c => c.id === selectedClientId) || null
  , [initialClients, selectedClientId]);

  const contractClient = useMemo(() => 
    initialClients.find(c => c.id === contractClientId) || null
  , [initialClients, contractClientId]);

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Caută în baza de date pacienți..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-11 px-4 rounded-2xl border-slate-200 text-slate-600 gap-2 font-bold">
              <Filter className="h-4 w-4" /> Filtrează
           </Button>
           <Button asChild className="h-11 px-6 rounded-2xl font-black shadow-xl shadow-primary/20 gap-2">
             <Link href="/dashboard/clients/new">
                <Plus className="h-5 w-5" /> Adaugă Client
             </Link>
           </Button>
        </div>
      </div>

      {/* Modern Dense Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-b-slate-100">
              <TableHead className="w-[300px] py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 pl-8">Informații Pacient</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Status & Profil</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Legal (GDPR)</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Vechime</TableHead>
              <TableHead className="text-right pr-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Fișă</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="h-12 w-12 opacity-20" />
                      <p className="font-medium">Nu am găsit niciun client cu acest nume.</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const anonymized = !!client.notes_anonymized_at;
                return (
                  <TableRow 
                    key={client.id} 
                    className="group cursor-pointer hover:bg-slate-50/80 transition-all border-b-slate-50"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-black text-slate-700 shadow-inner group-hover:from-primary/10 group-hover:to-primary/20 group-hover:text-primary transition-colors">
                          {initialsFromName(client.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                            {client.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            {anonymized ? "REDACTED@cepaipatit.ro" : client.email || "fără email"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {client.is_minor && (
                          <Badge variant="secondary" className="bg-amber-100/50 text-amber-700 border-amber-100 hover:bg-amber-100 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg h-6">
                            <Baby className="mr-1 h-3 w-3" /> Minor
                          </Badge>
                        )}
                        {client.billing_type === "B2B_COMPANY" && (
                          <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg h-6">
                            <Building className="mr-1 h-3 w-3" /> B2B
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 px-1">
                          <MapPin className="h-3 w-3" /> 
                          {client.location === "CLINICA" ? "Clinică" : "Cabinet"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         {client.gdpr_consent_signed ? (
                           <div className="flex h-7 px-3 items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                             <ShieldCheck className="h-3 w-3" />
                             <span className="text-[10px] font-black uppercase tracking-tight">Semnat</span>
                           </div>
                         ) : (
                           <div className="flex h-7 px-3 items-center gap-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 animate-pulse-subtle">
                             <ShieldOff className="h-3 w-3" />
                             <span className="text-[10px] font-black uppercase tracking-tight">Lipsă</span>
                           </div>
                         )}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">
                             {format(new Date(client.created_at), "MMM yyyy", { locale: ro })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">înregistrat</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2">
                         {!anonymized && (
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
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
                           className="h-9 w-9 rounded-xl text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all"
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
