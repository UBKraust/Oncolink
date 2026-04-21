"use client";

import React, { useState, useEffect } from "react";
import { 
  FileCheck, 
  FileText, 
  Building, 
  Baby, 
  Stethoscope, 
  Download, 
  Loader2,
  AlertCircle,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { generateContract } from "@/lib/pdf/templates";
import { getTherapistSettings, TherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { cn } from "@/lib/utils";

interface ContractGeneratorProps {
  client: any;
  onSuccess?: () => void;
}

type TemplateType = "STANDARD" | "MINOR" | "B2B" | "CAS";

export function ContractGenerator({ client, onSuccess }: ContractGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TherapistSettings | null>(null);
  const [template, setTemplate] = useState<TemplateType>("STANDARD");
  
  // Form fields
  const [contractNumber, setContractNumber] = useState("");
  const [repName, setRepName] = useState(client.company_representative_name || "");
  const [repRole, setRepRole] = useState(client.company_representative_role || "");
  const [regCom, setRegCom] = useState(client.company_reg_com || "");

  // Auto-detection and numbering
  useEffect(() => {
    async function load() {
      const s = await getTherapistSettings();
      setSettings(s);
    }
    load();

    // Default template based on client type
    if (client.is_minor) setTemplate("MINOR");
    else if (client.billing_type === "B2B_COMPANY") setTemplate("B2B");
    else setTemplate("STANDARD");

    // Generate sequential number: YEAR-MONTH-RAND3
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    setContractNumber(`${year}-${month}-${rand}`);
  }, [client]);

  const handleGenerate = async () => {
    if (!settings) return;
    setLoading(true);

    try {
      await generateContract({
        contractNumber,
        startDate: new Date().toLocaleDateString("ro-RO"),
        clientName: client.full_name,
        clientCNP: client.cnp_cif || "—",
        clientAddress: client.address || "—",
        therapistName: settings.full_name || "—",
        therapistCIF: settings.cif || "—",
        therapistIBAN: settings.iban || undefined,
        sessionPrice: Number(client.session_price) || settings.default_session_price,
        
        isMinor: template === "MINOR",
        parent1Name: client.parent_1_name || client.parent_name,
        parent2Name: client.parent_2_name,
        parentsMaritalStatus: client.parents_marital_status,
        
        isB2B: template === "B2B",
        companyName: client.company_name,
        companyCIF: client.cnp_cif,
        companyRegCom: regCom,
        representativeName: repName,
        representativeRole: repRole,

        isCas: template === "CAS",
        // These would ideally come from the latest referral linked to the client
        referralNumber: "BT-DEMO",
        referralDate: new Date().toLocaleDateString("ro-RO"),
        referringDoctor: "Medic Familia"
      });
      onSuccess?.();
    } catch (error) {
      console.error("PDF Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (t: TemplateType) => {
    switch (t) {
      case "MINOR": return <Baby className="h-4 w-4" />;
      case "B2B": return <Building className="h-4 w-4" />;
      case "CAS": return <Stethoscope className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isB2BMissingData = template === "B2B" && (!repName || !repRole);

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden bg-slate-50/30">
      <CardHeader className="pb-3 border-b bg-white">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
           </div>
           <div>
              <CardTitle className="text-base font-bold">Generator Contracte</CardTitle>
              <CardDescription className="text-xs">Selectează modelul și generează PDF-ul pentru semnare.</CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Model Contract</Label>
            <Select 
              value={template} 
              onChange={(e) => setTemplate(e.target.value as TemplateType)}
              className="rounded-xl border-slate-200 bg-white"
            >
              <option value="STANDARD">Standard (Individual)</option>
              <option value="MINOR">Minor (Legea 272/2004)</option>
              <option value="B2B">Business (B2B / Firmă)</option>
              <option value="CAS">Consimțământ CAS</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Număr Contract</Label>
            <div className="relative">
               <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
               <Input 
                 value={contractNumber} 
                 onChange={(e) => setContractNumber(e.target.value)}
                 className="pl-9 rounded-xl border-slate-200 bg-white font-mono text-sm"
               />
            </div>
          </div>
        </div>

        {template === "B2B" && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Detalii Reprezentant Legal</p>
             <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                   <Label className="text-[10px] text-slate-500 font-bold">Nume Complet</Label>
                   <Input 
                     value={repName} 
                     onChange={(e) => setRepName(e.target.value)} 
                     placeholder="Ex: Ion Popescu"
                     className="h-8 text-sm rounded-lg bg-white"
                   />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] text-slate-500 font-bold">Calitate / Rol</Label>
                   <Input 
                     value={repRole} 
                     onChange={(e) => setRepRole(e.target.value)} 
                     placeholder="Ex: Administrator"
                     className="h-8 text-sm rounded-lg bg-white"
                   />
                </div>
                <div className="sm:col-span-2 space-y-1">
                   <Label className="text-[10px] text-slate-500 font-bold">Reg. Com.</Label>
                   <Input 
                     value={regCom} 
                     onChange={(e) => setRegCom(e.target.value)} 
                     placeholder="Ex: J40/1234/2020"
                     className="h-8 text-sm rounded-lg bg-white"
                   />
                </div>
             </div>
          </div>
        )}

        {template === "MINOR" && !client.parent_name && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
             <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
             <p className="text-[10px] text-amber-700 font-medium leading-tight">
               Eroare: Lipsesc datele părinților. Te rugăm să actualizezi profilul clientului înainte de a genera contractul de minor.
             </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-white border-t p-4 flex flex-col gap-3">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
            {getTemplateIcon(template)}
            {template === "B2B" ? "Model Business" : template === "MINOR" ? "Model Protecție Minor" : template === "CAS" ? "Model Asigurări Sănătate" : "Model Standard Client"}
         </div>
         <Button 
           onClick={handleGenerate} 
           disabled={loading || !settings || isB2BMissingData}
           className="w-full rounded-xl font-black shadow-lg shadow-primary/20 gap-2 h-11"
         >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            GENEREAZĂ PDF CONTRACT
         </Button>
         <p className="text-[9px] text-center text-slate-400 font-medium">
           Documentul va fi descărcat local și poate fi semnat digital pe tabletă.
         </p>
      </CardFooter>
    </Card>
  );
}
