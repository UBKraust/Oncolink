"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, FileText, Heart, Loader2, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/app/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTemplateVersion } from "@/lib/contracts/numbering";
import type { TemplateType } from "@/lib/contracts/types";
import { generateContract, generateGdprConsent } from "@/lib/pdf/templates";

type DocumentClient = {
  id: string;
  full_name: string | null;
  cnp_cif: string | null;
  address: string | null;
  gdpr_consent_signed: boolean;
};

const CONTRACT_TEMPLATES: { value: TemplateType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "STANDARD", label: "Contract individual (adult)", icon: FileText, description: "Client adult, ședințe individuale" },
  { value: "MINOR",    label: "Contract pentru minor",       icon: Users,    description: "Include bloc semnătură reprezentant legal" },
  { value: "B2B",      label: "Contract firmă / B2B",        icon: Building2, description: "Companie sau angajator plătitor" },
  { value: "CAS",      label: "Consimțământ informat CAS",   icon: Heart,    description: "Servicii decontate prin asigurări" },
];

interface DocumentListProps {
  clients: DocumentClient[];
  therapistName: string;
  therapistEntity?: string;
  therapistCif?: string;
  defaultSessionPrice?: number;
  defaultClientId?: string;
}

export function DocumentList({
  clients,
  therapistName,
  therapistEntity,
  therapistCif,
  defaultSessionPrice = 250,
  defaultClientId,
}: DocumentListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("STANDARD");
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (defaultClientId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [defaultClientId]);

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

  const handleContract = async (c: DocumentClient) => {
    setLoading(`contract-${c.id}`);
    try {
      const result = await generateContract({
        contractNumber: `CTR-${new Date().getFullYear()}-${c.id.slice(0, 8)}`,
        clientName: c.full_name ?? "Client",
        clientCNP: c.cnp_cif ?? "—",
        clientAddress: c.address ?? "—",
        therapistName,
        therapistCIF: therapistCif ?? process.env.NEXT_PUBLIC_THERAPIST_CIF ?? "—",
        therapistPracticeName: therapistEntity,
        sessionPrice: defaultSessionPrice,
        startDate: new Date().toLocaleDateString("ro-RO"),
        templateType: selectedTemplate,
        templateVersion: getTemplateVersion(selectedTemplate),
        documentStatus: "ISSUED",
        statusLabel: "EMIS",
      });
      downloadBlob(result.blob, result.fileName);
    } finally {
      setLoading(null);
    }
  };

  const handleGdpr = async (c: DocumentClient) => {
    setLoading(`gdpr-${c.id}`);
    try {
      const result = await generateGdprConsent({
        clientName: c.full_name ?? "Client",
        clientCNP: c.cnp_cif ?? "—",
        therapistName,
        therapistEntity,
        therapistCIF: therapistCif ?? process.env.NEXT_PUBLIC_THERAPIST_CIF ?? "—",
        date: new Date().toLocaleDateString("ro-RO"),
      });
      downloadBlob(result.blob, result.fileName);
    } finally {
      setLoading(null);
    }
  };

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Niciun client activ"
        description="Documentele pot fi generate doar pentru clienți activi. Adaugă un client pentru a începe."
        action={{ label: "Client nou", href: "/dashboard/clients/new" }}
      />
    );
  }

  const activeTemplateInfo = CONTRACT_TEMPLATES.find((t) => t.value === selectedTemplate)!;
  const ActiveIcon = activeTemplateInfo.icon;

  return (
    <Card className="rounded-[2rem] border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-black tracking-tight">Clienți activi</CardTitle>

          {/* Template selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tip contract:</span>
            <div className="relative flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-sm shadow-sm">
              <ActiveIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                className="appearance-none bg-transparent pr-5 text-sm font-medium text-foreground focus:outline-none"
              >
                {CONTRACT_TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">▾</span>
            </div>
          </div>
        </div>

        {/* Template description */}
        <p className="text-xs text-muted-foreground">{activeTemplateInfo.description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>CNP / CIF</TableHead>
              <TableHead>GDPR semnat</TableHead>
              <TableHead className="text-right">Generează PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => {
              const isHighlighted = defaultClientId === c.id;
              return (
                <TableRow
                  key={c.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={isHighlighted ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : undefined}
                >
                  <TableCell className="font-medium">{c.full_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {c.cnp_cif ?? "—"}
                  </TableCell>
                  <TableCell>
                    {c.gdpr_consent_signed ? (
                      <Badge variant="success">Semnat</Badge>
                    ) : (
                      <Badge variant="warning">Lipsă</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!loading}
                        onClick={() => handleContract(c)}
                        aria-label={`Generează ${activeTemplateInfo.label} pentru ${c.full_name ?? "client"}`}
                      >
                        {loading === `contract-${c.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ActiveIcon className="h-3.5 w-3.5" />
                        )}
                        Contract
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!loading}
                        onClick={() => handleGdpr(c)}
                        aria-label={`Generează acordul GDPR pentru ${c.full_name ?? "client"}`}
                      >
                        {loading === `gdpr-${c.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                        GDPR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
