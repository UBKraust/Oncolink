"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  UserPlus, 
  Baby, 
  Calendar, 
  Receipt, 
  Copy, 
  Check, 
  X,
  Zap
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
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const copyLink = (path: string, label: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    showNotification(`Link ${label} copiat!`);
    setIsOpen(false);
  };

  const actions: QuickAction[] = [
    {
      id: "minor",
      label: "Onboarding Minor",
      icon: Baby,
      color: "bg-amber-500 shadow-amber-200",
      action: () => copyLink("/onboarding/minor", "Minor"),
    },
    {
      id: "adult",
      label: "Onboarding Adult",
      icon: UserPlus,
      color: "bg-blue-500 shadow-blue-200",
      action: () => copyLink("/onboarding/adult", "Adult"),
    },
    {
      id: "app",
      label: "Programare Nouă",
      icon: Calendar,
      color: "bg-emerald-500 shadow-emerald-200",
      action: () => {
        window.location.href = "/dashboard/appointments/new";
      },
    },
    {
      id: "expense",
      label: "Cheltuială Nouă",
      icon: Receipt,
      color: "bg-rose-500 shadow-rose-200",
      action: () => {
        window.location.href = "/dashboard/expenses";
      },
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 print:hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="animate-in slide-in-from-right-full fade-in duration-300 flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-2xl">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3" />
          </div>
          {notification}
        </div>
      )}

      {/* Actions */}
      <div className="relative">
        {/* The "Wheel" of buttons */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300">
            {actions.map((act, idx) => (
              <button
                key={act.id}
                onClick={act.action}
                className="group flex items-center gap-3 transition-all duration-300 hover:-translate-x-2"
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <span className="rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {act.label}
                </span>
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform hover:scale-110 active:scale-95",
                  act.color
                )}>
                  <act.icon className="h-6 w-6" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "group relative flex h-16 w-16 items-center justify-center rounded-[2rem] transition-all duration-500 shadow-2xl hover:scale-105 active:scale-95 overflow-hidden",
            isOpen 
              ? "bg-slate-900 rotate-45" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {isOpen ? (
            <X className="h-8 w-8 text-white -rotate-45" />
          ) : (
            <div className="relative">
               <Zap className="h-8 w-8 text-white animate-pulse" />
               <Plus className="absolute -bottom-1 -right-1 h-4 w-4 text-white bg-slate-900 rounded-full border-2 border-primary" />
            </div>
          )}
        </button>
      </div>
      
      {/* Overlay backing when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-500 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
