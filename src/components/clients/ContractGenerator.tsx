"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Baby,
  Building,
  Download,
  Eye,
  FileCheck,
  FileText,
  Hash,
  Info,
  Loader2,
  Stethoscope,
} from "lucide-react";

import { getLatestReferralDocument, issueGeneratedContractNumber } from "@/app/dashboard/clients/actions";
import { getTherapistSettings, type TherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { buildDraftContractNumber, buildInitialContractNumber, getTemplateVersion } from "@/lib/contracts/numbering";
import { buildContractPayload, formatDateForDisplay, formatDateForInput } from "@/lib/contracts/payload";
import type { ReferralDocumentSummary, TemplateType } from "@/lib/contracts/types";
import { getMissingContractData } from "@/lib/contracts/validation";
import { generateContract } from "@/lib/pdf/templates";

import type { ClientProfile } from "./types";

interface ContractGeneratorProps {
  client: ClientProfile;
  onSuccess?: () => void;
}

async function persistGeneratedContract(params: {
  blob: Blob;
  fileName: string;
  clientId: string;
  generatedContractId: string;
  contractNumber: string;
  templateType: TemplateType;
  templateVersion: string;
}) {
  const file = new File([params.blob], params.fileName, { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("clientId", params.clientId);
  formData.append("generatedContractId", params.generatedContractId);
  formData.append("contractNumber", params.contractNumber);
  formData.append("templateType", params.templateType);
  formData.append("templateVersion", params.templateVersion);

  const response = await fetch("/api/contracts/generated", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Nu am putut salva contractul în baza de date.");
  }
}

export function ContractGenerator({ client, onSuccess }: ContractGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [settings, setSettings] = useState<TherapistSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [latestReferral, setLatestReferral] = useState<ReferralDocumentSummary | null>(null);
  const [template, setTemplate] = useState<TemplateType>(
    client.is_minor ? "MINOR" : client.billing_type === "B2B_COMPANY" ? "B2B" : "STANDARD",
  );
  const [issuedContractNumber, setIssuedContractNumber] = useState<string | null>(null);
  const [repName, setRepName] = useState(client.company_representative_name || "");
  const [repRole, setRepRole] = useState(client.company_representative_role || "");
  const [regCom, setRegCom] = useState(client.company_reg_com || "");
  const [referralNumber, setReferralNumber] = useState("");
  const [referralDate, setReferralDate] = useState("");
  const [referringDoctor, setReferringDoctor] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setSettingsError(null);
        const [therapistSettings, latestReferralDocument] = await Promise.all([
          getTherapistSettings(),
          getLatestReferralDocument(client.id),
        ]);

        if (!active) return;

        setSettings(therapistSettings);
        setLatestReferral(latestReferralDocument);
        setReferralNumber(latestReferralDocument?.referral_number || "");
        setReferralDate(formatDateForInput(latestReferralDocument?.referral_date) || "");
        setReferringDoctor(latestReferralDocument?.referring_doctor_code || "");
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : "Nu am putut încărca setările terapeutului din Supabase.";
        setSettings(null);
        setSettingsError(message);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [client]);

  const contractContext = {
    client,
    settings,
    template,
    repName,
    repRole,
    regCom,
    referralNumber,
    referralDate,
    referringDoctor,
  };

  const missingDataGroups = getMissingContractData(contractContext);
  const hasMissingData = missingDataGroups.length > 0;
  const templateVersion = getTemplateVersion(template);
  const displayContractNumber = issuedContractNumber ?? buildInitialContractNumber();

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const previewBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleGenerate = async (mode: "download" | "preview") => {
    if (!settings || hasMissingData) return;

    if (mode === "download") setLoading(true);
    else setPreviewLoading(true);

    try {
      if (mode === "preview") {
        const previewContractNumber = buildDraftContractNumber();
        const previewPayload = buildContractPayload(contractContext, {
          contractNumber: previewContractNumber,
          status: "DRAFT",
        });

        if (!previewPayload) {
          toast.error("Nu am putut pregăti contractul.");
          return;
        }

        const previewResult = await generateContract(previewPayload);
        previewBlob(previewResult.blob);
        toast.success(`Previzualizarea ${previewContractNumber} a fost deschisă local.`);
        return;
      }

      const issuedContract = await issueGeneratedContractNumber(client.id, template);
      if ("error" in issuedContract) {
        toast.error(issuedContract.error || "Nu am putut emite numărul contractului.");
        return;
      }

      setIssuedContractNumber(issuedContract.contract_number);

      const finalPayload = buildContractPayload(contractContext, {
        contractNumber: issuedContract.contract_number,
        status: "ISSUED",
      });

      if (!finalPayload) {
        toast.error("Nu am putut pregăti contractul.");
        return;
      }

      const result = await generateContract(finalPayload);

      let persistenceWarning: string | null = null;
      try {
        await persistGeneratedContract({
          blob: result.blob,
          fileName: result.fileName,
          clientId: client.id,
          generatedContractId: issuedContract.id,
          contractNumber: issuedContract.contract_number,
          templateType: template,
          templateVersion,
        });
      } catch (persistError) {
        persistenceWarning =
          persistError instanceof Error
            ? persistError.message
            : "Nu am putut salva contractul în baza de date.";
        console.warn("Generated contract persistence failed:", persistError);
      }

      downloadBlob(result.blob, result.fileName);
      if (persistenceWarning) {
        toast.success(`Contractul ${issuedContract.contract_number} a fost emis și descărcat local. Persistarea remote a întâmpinat o problemă.`);
      } else {
        toast.success(`Contractul ${issuedContract.contract_number} a fost emis și descărcat local.`);
      }

      onSuccess?.();
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("Nu am putut genera contractul.");
    } finally {
      if (mode === "download") setLoading(false);
      else setPreviewLoading(false);
    }
  };

  const getTemplateIcon = (value: TemplateType) => {
    switch (value) {
      case "MINOR":
        return <Baby className="h-4 w-4" />;
      case "B2B":
        return <Building className="h-4 w-4" />;
      case "CAS":
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden bg-slate-50/30">
      <CardHeader className="pb-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Generator Contracte</CardTitle>
            <CardDescription className="text-xs">
              Selectează modelul și generează PDF-ul pentru semnare.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Model Contract</Label>
            <Select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value as TemplateType);
                setIssuedContractNumber(null);
              }}
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
                value={displayContractNumber}
                readOnly
                className="pl-9 rounded-xl border-slate-200 bg-white font-mono text-sm"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-medium">
              Preview-ul folosește un număr draft. Numărul oficial se alocă doar la emitere și se salvează în registru.
            </p>
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

        {template === "MINOR" && !client.parent_1_name && !client.parent_name && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 font-medium leading-tight">
              Eroare: Lipsesc datele părinților. Te rugăm să actualizezi profilul clientului înainte de a genera contractul de minor.
            </p>
          </div>
        )}

        {template === "CAS" && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Date CAS</p>
                <p className="text-[10px] text-emerald-800/80">
                  {latestReferral
                    ? `Ultimul bilet găsit: ${latestReferral.referral_number || "fără număr"} din ${formatDateForDisplay(latestReferral.referral_date)}.`
                    : "Nu am găsit niciun bilet CAS încărcat pentru acest client. Poți completa manual datele de mai jos."}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold">Număr Bilet</Label>
                <Input
                  value={referralNumber}
                  onChange={(e) => setReferralNumber(e.target.value)}
                  placeholder="Ex: BT-2026-001234"
                  className="h-8 text-sm rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold">Data Biletului</Label>
                <Input
                  type="date"
                  value={referralDate}
                  onChange={(e) => setReferralDate(e.target.value)}
                  className="h-8 text-sm rounded-lg bg-white"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold">Medic Trimițător / Cod Parafă</Label>
                <Input
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="Ex: Dr. Ionescu / parafă 12345"
                  className="h-8 text-sm rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {missingDataGroups.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-rose-700 font-black uppercase tracking-wider">
                Date necesare înainte de generare
              </p>
              <div className="space-y-2">
                {missingDataGroups.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <p className="text-[10px] text-rose-700 font-bold leading-tight">{group.category}</p>
                    {group.items.map((item) => (
                      <p key={item} className="text-[10px] text-rose-700 font-medium leading-tight">
                        • {item}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {settingsError ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
                Setările terapeutului nu au putut fi încărcate
              </p>
              <p className="text-[10px] text-amber-700 font-medium leading-tight">{settingsError}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="bg-white border-t p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
          {getTemplateIcon(template)}
          {template === "B2B"
            ? "Model Business"
            : template === "MINOR"
              ? "Model Protecție Minor"
              : template === "CAS"
                ? "Model Asigurări Sănătate"
                : "Model Standard Client"}{" "}
          · {templateVersion}
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleGenerate("preview")}
            disabled={previewLoading || loading || !settings || hasMissingData}
            className="w-full rounded-xl font-black gap-2 h-11 border-slate-200"
          >
            {previewLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
            PREVIZUALIZEAZĂ PDF
          </Button>
          <Button
            onClick={() => handleGenerate("download")}
            disabled={loading || previewLoading || !settings || hasMissingData}
            className="w-full rounded-xl font-black shadow-lg shadow-primary/20 gap-2 h-11"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            EMITE ȘI DESCARCĂ PDF
          </Button>
        </div>
        <p className="text-[9px] text-center text-slate-400 font-medium">
          Preview-ul rămâne local. Emiterea finală înregistrează contractul și apoi descarcă PDF-ul.
        </p>
      </CardFooter>
    </Card>
  );
}
