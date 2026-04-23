"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const AlertDialog = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: { 
  children: React.ReactNode, 
  open?: boolean, 
  onOpenChange?: (open: boolean) => void 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("useAlertDialog must be used within AlertDialog");
  return context;
};

const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => {
  const { setOpen } = useAlertDialog();
  return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
    onClick: () => setOpen(true),
  });
};

const AlertDialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { open, setOpen } = useAlertDialog();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn("relative bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200", className)}>
        {children}
      </div>
    </div>
  );
};

const AlertDialogHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

const AlertDialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-6 pt-0 flex flex-col gap-2", className)}>{children}</div>
);

const AlertDialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={cn("text-xl font-bold", className)}>{children}</h2>
);

const AlertDialogDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("text-sm text-slate-500", className)}>{children}</div>
);

const AlertDialogAction = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
  const { setOpen } = useAlertDialog();
  return (
    <button
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn("w-full bg-primary text-white font-bold py-3 rounded-2xl shadow-lg", className)}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { setOpen } = useAlertDialog();
  return (
    <button
      onClick={() => setOpen(false)}
      className={cn("w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl", className)}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
