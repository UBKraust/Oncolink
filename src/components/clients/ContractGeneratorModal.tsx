"use client";

import React from "react";
import { X } from "lucide-react";
import { ContractGenerator } from "./ContractGenerator";
import type { ClientProfile } from "./types";
import { cn } from "@/lib/utils";

interface ContractGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile | null;
}

export function ContractGeneratorModal({ isOpen, onClose, client }: ContractGeneratorModalProps) {
  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[150] flex items-center justify-center p-4 transition-opacity duration-300",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cn(
        "relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl transition-all duration-300 overflow-hidden",
        isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
      )}>
        {/* Header with Close Button */}
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[90vh] overflow-auto custom-scrollbar">
          {client && (
            <ContractGenerator 
              key={client.id}
              client={client}
              onSuccess={() => {
                // We keep it open so they see the download happened, 
                // but we could also auto-close if preferred.
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
