"use client";

import { useState } from "react";
import { Lock, LockOpen, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PinDialog } from "./pin-dialog";
import { useNotesVault } from "./notes-context";

/**
 * Topbar widget that shows vault status and opens the PIN dialog.
 * In demo mode the button is disabled upstream via the demoMode prop.
 */
export function VaultIndicator({ demoMode }: { demoMode: boolean }) {
  const { status, lock } = useNotesVault();
  const [open, setOpen] = useState(false);

  const renderBadge = () => {
    if (demoMode)
      return (
        <Badge variant="warning" className="gap-1">
          <Lock className="h-3 w-3" />
          Note criptate
        </Badge>
      );
    if (status === "unlocked")
      return (
        <Badge variant="success" className="gap-1">
          <LockOpen className="h-3 w-3" />
          Note deblocate
        </Badge>
      );
    if (status === "needs-setup")
      return (
        <Badge variant="warning" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          PIN neconfigurat
        </Badge>
      );
    return (
      <Badge variant="warning" className="gap-1">
        <Lock className="h-3 w-3" />
        Note criptate
      </Badge>
    );
  };

  const buttonLabel =
    status === "unlocked"
      ? "Blochează"
      : status === "needs-setup"
        ? "Setează PIN"
        : "Deblochează cu PIN";

  return (
    <>
      {renderBadge()}
      <Button
        size="sm"
        variant="outline"
        disabled={demoMode || status === "loading"}
        onClick={() => {
          if (status === "unlocked") lock();
          else setOpen(true);
        }}
      >
        {status === "unlocked" ? (
          <LockOpen className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {buttonLabel}
      </Button>
      <PinDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
