import Link from "next/link";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/page-shell";

interface VaultStatusWidgetProps {
  alerts: number;
  totalDocs: number;
}

export function VaultStatusWidget({ alerts, totalDocs }: VaultStatusWidgetProps) {
  return (
    <SectionCard
      title="Seif digital cabinet"
      description={alerts > 0 ? `${alerts} documente expiră în curând` : "Toate documentele sunt valide."}
      icon={Lock}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black tracking-tight text-foreground">{totalDocs}</p>
            <p className="text-xs text-muted-foreground">documente salvate</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {alerts > 0 ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-foreground/60" />
            )}
          </div>
        </div>

        {alerts > 0 && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {alerts} documente expiră în curând
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Verifică Certificarea CPR sau Asigurarea.
            </p>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/dashboard/vault">Accesează seiful</Link>
        </Button>
      </div>
    </SectionCard>
  );
}
