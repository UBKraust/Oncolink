"use client";

import React, { useEffect, useRef, useState } from "react";
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
  size?: "sm" | "md" | "lg";
  maxWidth?: string;
}

const SIZE_CLASS: Record<NonNullable<SectionDetailOverlayProps["size"]>, string> = {
  sm: "max-w-lg",
  md: "max-w-xl",
  lg: "max-w-2xl",
};

export function SectionDetailOverlay({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = "md",
  maxWidth,
}: SectionDetailOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPresent, setIsPresent] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isOpen) {
      setIsPresent(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setIsPresent(false);
      closeTimerRef.current = null;
    }, 260);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useOverlayA11y({
    open: isPresent,
    onClose,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isPresent) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ease-out",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-foreground/20 transition-all duration-300 ease-out",
          isVisible ? "backdrop-blur-sm" : "backdrop-blur-0",
        )}
        onClick={onClose}
      />

      {/* Pane */}
      <div
        ref={panelRef}
        className={cn(
        "relative h-full w-full bg-card shadow-2xl transition-[transform,opacity] duration-300 ease-out flex flex-col",
        maxWidth || SIZE_CLASS[size],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-detail-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 id="section-detail-title" className="text-lg font-black uppercase tracking-tight leading-none text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          <div className="border-t border-border/70 bg-muted/30 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
