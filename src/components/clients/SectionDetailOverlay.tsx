"use client";

import React, { useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";

interface SectionDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function SectionDetailOverlay({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = "max-w-xl",
}: SectionDetailOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useOverlayA11y({
    open: isOpen,
    onClose,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[110] flex justify-end transition-opacity duration-300",
      "opacity-100"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Pane */}
      <div
        ref={panelRef}
        className={cn(
        "relative h-full w-full bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col",
        maxWidth,
        "translate-x-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-detail-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 id="section-detail-title" className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
            aria-label={`Închide secțiunea ${title}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="border-t p-6 bg-slate-50/80 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
