"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("useSheet must be used within Sheet");
  return ctx;
}

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useSheet();
  const panelRef = React.useRef<HTMLDivElement>(null);

  useOverlayA11y({
    open,
    onClose: () => onOpenChange(false),
    containerRef: panelRef,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-label="Închide panoul"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-border/60 bg-card shadow-2xl animate-in slide-in-from-right duration-200",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("shrink-0 border-b border-border/60 p-6", className)}>
      {children}
    </div>
  );
}

function SheetTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-black tracking-tight text-foreground", className)}>
      {children}
    </h2>
  );
}

function SheetDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

function SheetBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto custom-scrollbar", className)}>
      {children}
    </div>
  );
}

function SheetFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("shrink-0 border-t border-border/60 p-4", className)}>
      {children}
    </div>
  );
}

function SheetClose({ className }: { className?: string }) {
  const { onOpenChange } = useSheet();
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      aria-label="Închide"
      className={cn(
        "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
};
