import { Scale } from "lucide-react";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";

export default function CompliancePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          Conformitate Legală
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Verificare automată a conformității juridice pentru fiecare pacient, pe baza legislației românești în vigoare.
          Regulile verificate acoperă GDPR, Legea 213/2004, Legea 272/2004 (minori), e-Factura și Legea contabilității.
        </p>
      </div>

      {/* Legal legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {[
          { id: "R1", label: "GDPR Consent", law: "Reg. 2016/679, Legea 190/2018", sev: "CRITICAL" },
          { id: "R2", label: "Contract Terapeutic", law: "Legea 213/2004, Cod Deontologic CPR", sev: "WARNING" },
          { id: "R3", label: "Acord Ambii Părinți", law: "Legea 272/2004, Regulament CPR", sev: "CRITICAL" },
          { id: "R4", label: "Sentință Custodie", law: "Legea 272/2004", sev: "WARNING" },
          { id: "R5", label: "Retenție Facturi 10 ani", law: "Legea 82/1991 (Legea Contabilității)", sev: "CRITICAL" },
          { id: "R6", label: "CNP pentru e-Factura", law: "OUG 120/2021, Legea 296/2023", sev: "WARNING" },
        ].map(rule => (
          <div key={rule.id} className="rounded-lg border bg-card px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-primary">{rule.id}</span>
              <span className="font-medium">{rule.label}</span>
              <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                rule.sev === "CRITICAL"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              }`}>{rule.sev}</span>
            </div>
            <p className="text-muted-foreground leading-snug">{rule.law}</p>
          </div>
        ))}
      </div>

      <CompliancePanel compact={false} />
    </div>
  );
}
