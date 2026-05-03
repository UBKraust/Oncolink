"use client";

import React, { useRef } from "react";
import { X } from "lucide-react";
import { ContractGenerator } from "./ContractGenerator";
import type { ClientProfile } from "./types";
import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";

interface ContractGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile | null;
}

export function ContractGeneratorModal({ isOpen, onClose, client }: ContractGeneratorModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useOverlayA11y({
    open: isOpen,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[150] flex items-center justify-center p-4 transition-opacity duration-300",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        ref={dialogRef}
        className={cn(
        "relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border/70 bg-card shadow-2xl transition-all duration-300",
        isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contract-generator-title"
        tabIndex={-1}
      >
        {/* Header with Close Button */}
        <div className="absolute top-6 right-6 z-10">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label="Închide generatorul de contract"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[90vh] overflow-auto custom-scrollbar">
          {client && (
            <>
              <h2 id="contract-generator-title" className="sr-only">
                Generator contract pentru {client.full_name ?? "client"}
              </h2>
              <ContractGenerator
                key={client.id}
                client={client}
                onSuccess={() => {
                  // We keep it open so they see the download happened,
                  // but we could also auto-close if preferred.
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
