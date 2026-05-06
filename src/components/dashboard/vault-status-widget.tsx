import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, ShieldCheck, ShieldEllipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      description={alerts > 0 ? `${alerts} documente expiră în curând` : "Actele cabinetului sunt în parametri buni."}
      icon={Lock}
    >
      <div className="border-t border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),transparent_55%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(248,250,252,0.45))] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant={alerts > 0 ? "warning" : "success"} className="w-fit">
              {alerts > 0 ? "Necesită atenție" : "Stare bună"}
            </Badge>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Control administrativ
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{totalDocs}</p>
              <p className="text-xs text-muted-foreground">documente urmărite centralizat</p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-card shadow-sm">
            {alerts > 0 ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-foreground/60" />
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Documente sensibile
            </p>
            <p className="mt-3 text-lg font-black tracking-tight text-foreground">Avize, acte de cabinet și polițe</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Punct unic pentru status și expirări, fără căutări în mai multe ecrane.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldEllipsis className="h-3.5 w-3.5" />
              Prioritate
            </div>
            <p className="mt-3 text-lg font-black tracking-tight text-foreground">
              {alerts > 0 ? `${alerts} documente cer revizuire` : "Nicio expirare în fereastra critică"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {alerts > 0 ? "Verifică întâi certificările și asigurările cu termen apropiat." : "Zona de cabinet este stabilă și nu cere intervenție imediată."}
            </p>
          </div>
        </div>

        {alerts > 0 && (
          <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-muted/20 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {alerts} documente expiră în curând
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Verifică Certificarea CPR sau Asigurarea.
            </p>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-[1.25rem]">
          <Link href="/dashboard/vault">Accesează seiful</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full rounded-[1.25rem] text-xs text-muted-foreground">
          <Link href="/dashboard/settings">
            Verifică setările cabinetului
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}
