"use client";

import { useState } from "react";
import { FileText, Loader2, ShieldCheck, Users } from "lucide-react";

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
import { generateContract, generateGdprConsent } from "@/lib/pdf/templates";

type DocumentClient = {
  id: string;
  full_name: string | null;
  cnp_cif: string | null;
  address: string | null;
  gdpr_consent_signed: boolean;
};

interface DocumentListProps {
  clients: DocumentClient[];
  therapistName: string;
  therapistEntity?: string;
  therapistCif?: string;
  defaultSessionPrice?: number;
}

export function DocumentList({
  clients,
  therapistName,
  therapistEntity,
  therapistCif,
  defaultSessionPrice = 250,
}: DocumentListProps) {
  const [loading, setLoading] = useState<string | null>(null);

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
        templateType: "STANDARD",
        templateVersion: getTemplateVersion("STANDARD"),
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

  return (
    <Card className="rounded-[2rem] border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <CardTitle className="text-base font-black tracking-tight">Clienți activi</CardTitle>
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
            {clients.map((c) => (
              <TableRow key={c.id}>
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
                      aria-label={`Generează contractul pentru ${c.full_name ?? "client"}`}
                    >
                      {loading === `contract-${c.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
