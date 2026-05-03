"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentChecklistCard } from "@/components/clients/DocumentChecklistCard";
import { getClientDocumentChecklist, type ClientDocumentChecklist } from "@/app/dashboard/clients/document-checklist-action";
import type { ServiceType } from "@/lib/clients/service-track";
import { SERVICE_TYPE_LABELS } from "@/lib/clients/service-track";

interface DocumentChecklistSheetProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
  clientName: string;
  serviceType: ServiceType | null;
}

export function DocumentChecklistSheet({
  open,
  onClose,
  clientId,
  clientName,
  serviceType,
}: DocumentChecklistSheetProps) {
  const [checklist, setChecklist] = useState<ClientDocumentChecklist | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !clientId || !serviceType) {
      setChecklist(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setChecklist(null);
    getClientDocumentChecklist(clientId, serviceType)
      .then((data) => {
        if (!cancelled) {
          setChecklist(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, serviceType]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetClose />

        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>{clientName}</SheetTitle>
              <SheetDescription>
                {serviceType ? `Documente ${SERVICE_TYPE_LABELS[serviceType]}` : "Documente client"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : checklist && clientId ? (
            <DocumentChecklistCard
              checklist={checklist}
              clientId={clientId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-muted text-muted-foreground/40">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Nu s-a putut încărca lista de documente.
              </p>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
