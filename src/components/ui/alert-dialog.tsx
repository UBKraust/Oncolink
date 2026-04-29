"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";

const AlertDialog = ({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode,
  open?: boolean,
  onOpenChange?: (open: boolean) => void
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const titleId = React.useId();
  const descriptionId = React.useId();

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
} | null>(null);

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("useAlertDialog must be used within AlertDialog");
  return context;
};

const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => {
  const { setOpen } = useAlertDialog();
  return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
    onClick: (event) => {
      (children as React.ReactElement<{ onClick?: React.MouseEventHandler }>).props.onClick?.(event);
      setOpen(true);
    },
  });
};

const AlertDialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { open, setOpen, titleId, descriptionId } = useAlertDialog();
  const contentRef = React.useRef<HTMLDivElement>(null);

  useOverlayA11y({
    open,
    onClose: () => setOpen(false),
    containerRef: contentRef,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div
        ref={contentRef}
        className={cn("relative w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
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

const AlertDialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { titleId } = useAlertDialog();
  return (
    <h2 id={titleId} className={cn("text-xl font-bold", className)}>
      {children}
    </h2>
  );
};

const AlertDialogDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { descriptionId } = useAlertDialog();
  return (
    <div id={descriptionId} className={cn("text-sm text-slate-500", className)}>
      {children}
    </div>
  );
};

const AlertDialogAction = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
  const { setOpen } = useAlertDialog();
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn("w-full rounded-2xl bg-primary py-3 font-bold text-white shadow-lg", className)}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { setOpen } = useAlertDialog();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={cn("w-full rounded-2xl py-3 font-bold text-slate-500 hover:bg-slate-50", className)}
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
