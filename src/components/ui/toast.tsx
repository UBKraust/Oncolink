"use client";

import { useState, useEffect, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notify = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

function scheduleRemoval(id: string, delay: number) {
  setTimeout(() => {
    // Mark as exiting first (triggers exit animation)
    toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
    notify();
    // Remove from DOM after animation completes
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 300);
  }, delay);
}

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    toasts.push({ id, message, type: "success" });
    notify();
    scheduleRemoval(id, 3000);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    toasts.push({ id, message, type: "error" });
    notify();
    scheduleRemoval(id, 5000);
  },
};

export function ToastProvider() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (next: Toast[]) => setActiveToasts(next);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
    notify();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 300);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
      {activeToasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={[
            "pointer-events-auto px-5 py-3.5 rounded-2xl shadow-xl border min-w-[280px] text-left",
            t.exiting
              ? "animate-out fade-out slide-out-to-right-6 duration-300 fill-mode-forwards"
              : "animate-in slide-in-from-right-6 fade-in duration-300",
            t.type === "success"
              ? "bg-white border-emerald-100 text-emerald-900 dark:bg-card dark:border-emerald-900/40 dark:text-emerald-100"
              : "bg-white border-rose-100 text-rose-900 dark:bg-card dark:border-rose-900/40 dark:text-rose-100",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div
              className={[
                "h-2 w-2 shrink-0 rounded-full",
                t.exiting ? "" : "animate-pulse",
                t.type === "success" ? "bg-emerald-500" : "bg-rose-500",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <p className="text-sm font-black tracking-tight">{t.message}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
