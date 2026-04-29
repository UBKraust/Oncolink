"use client";

import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple singleton-like behavior for global toasts
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notify = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    toasts.push({ id, message, type: 'success' });
    notify();
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      notify();
    }, 3000);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    toasts.push({ id, message, type: 'error' });
    notify();
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      notify();
    }, 5000);
  }
};

export function ToastProvider() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setActiveToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
      {activeToasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border min-w-[300px]
            animate-in slide-in-from-right-10 fade-in duration-300
            ${t.type === 'success' ? 'bg-white border-emerald-100 text-emerald-900' : 'bg-white border-rose-100 text-rose-900'}
          `}
        >
          <div className="flex items-center gap-3">
             <div className={`h-2 w-2 rounded-full ${t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
             <p className="text-sm font-black tracking-tight">{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
