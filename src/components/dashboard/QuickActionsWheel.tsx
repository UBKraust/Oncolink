"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Plus, 
  UserPlus, 
  Baby, 
  Calendar, 
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export function QuickActionsWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const hiddenRoutes = [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/appointments",
    "/dashboard/calendar",
  ];

  const shouldHide =
    hiddenRoutes.some((route) => pathname === route || pathname?.startsWith(`${route}/`)) ||
    pathname?.startsWith("/dashboard/clients/") ||
    pathname?.startsWith("/dashboard/appointments/");

  if (shouldHide) return null;

  const actions: QuickAction[] = [
    {
      id: "minor",
      label: "Pacient Minor",
      icon: Baby,
      color: "text-foreground bg-muted/60 border-border/70",
      action: () => {
        router.push("/dashboard/clients/new-minor");
        setIsOpen(false);
      },
    },
    {
      id: "adult",
      label: "Client Adult",
      icon: UserPlus,
      color: "text-foreground bg-muted/60 border-border/70",
      action: () => {
        router.push("/dashboard/clients/new");
        setIsOpen(false);
      },
    },
    {
      id: "app",
      label: "Programare Nouă",
      icon: Calendar,
      color: "text-foreground bg-muted/60 border-border/70",
      action: () => {
        router.push("/dashboard/appointments/new");
        setIsOpen(false);
      },
    },
    {
      id: "invoice",
      label: "Factură Nouă",
      icon: FileText,
      color: "text-foreground bg-muted/60 border-border/70",
      action: () => {
        router.push("/dashboard/invoices/new");
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 hidden bg-foreground/10 backdrop-blur-[1px] print:hidden md:block"
          onClick={() => setIsOpen(false)}
          aria-label="Închide meniul de acțiuni rapide"
        />
      )}

      <div className="fixed bottom-6 right-6 z-[45] hidden flex-col items-end gap-3 print:hidden md:flex">
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-64 overflow-hidden rounded-2xl border border-border/80 bg-card/98 p-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="border-b border-border/70 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Adaugă rapid
              </p>
            </div>
            <div className="grid gap-1 pt-2">
            {actions.map((act) => (
              <button
                key={act.id}
                onClick={act.action}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border",
                  act.color
                )}>
                  <act.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{act.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {act.id === "minor"
                        ? "Deschide fluxul pentru reprezentant legal"
                      : act.id === "adult"
                        ? "Creează rapid o fișă nouă"
                        : act.id === "app"
                          ? "Programează o nouă ședință"
                          : "Deschide direct emiterea unei facturi"}
                  </p>
                </div>
              </button>
            ))}
            </div>
            <div className="border-t border-border/70 px-3 py-2">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                Înapoi la dashboard
              </Link>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-card text-foreground transition-all duration-200 shadow-lg hover:border-primary/20 hover:bg-muted/60 hover:text-primary active:scale-95",
            isOpen 
              ? "rotate-45 border-primary/30 bg-primary/10" 
              : ""
          )}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Închide meniul de acțiuni rapide" : "Deschide meniul de acțiuni rapide"}
        >
          {isOpen ? (
            <X className="h-6 w-6 -rotate-45" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </div>
      </div>
    </>
  );
}
