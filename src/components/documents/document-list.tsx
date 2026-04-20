"use client";

import { useState } from "react";
import { FileText, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateContract, generateGdprConsent } from "@/lib/pdf/templates";
import type { MockClient } from "@/lib/mock/clients";

interface DocumentListProps {
  clients: MockClient[];
}

export function DocumentList({ clients }: DocumentListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleContract = async (c: MockClient) => {
    setLoading(`contract-${c.id}`);
    try {
      await generateContract({
        clientName: c.full_name ?? "Client",
        clientCNP: c.cnp_cif ?? "—",
        clientAddress: c.address ?? "—",
        therapistName: "Dr. Psiholog",
        therapistCIF: process.env.NEXT_PUBLIC_THERAPIST_CIF ?? "—",
        sessionPrice: 250,
        startDate: new Date().toLocaleDateString("ro-RO"),
      });
    } finally {
      setLoading(null);
    }
  };

  const handleGdpr = async (c: MockClient) => {
    setLoading(`gdpr-${c.id}`);
    try {
      await generateGdprConsent({
        clientName: c.full_name ?? "Client",
        clientCNP: c.cnp_cif ?? "—",
        therapistName: "Dr. Psiholog",
        date: new Date().toLocaleDateString("ro-RO"),
      });
    } finally {
      setLoading(null);
    }
  };

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Niciun client activ găsit.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clienți activi</CardTitle>
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
                    <span className="text-xs text-emerald-600">Da</span>
                  ) : (
                    <span className="text-xs text-amber-600">Nu</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!loading}
                      onClick={() => handleContract(c)}
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
