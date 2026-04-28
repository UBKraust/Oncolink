import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  ClientComplianceResult, 
  ComplianceSummary, 
  ComplianceIssue,
} from "./engine";

export async function runServerComplianceCheck(): Promise<ComplianceSummary> {
  const supabase = await createSupabaseServerClient();
  
  // Fetch everything needed for compliance
  const { data: clients } = await supabase.from("clients").select("*");
  const { data: docs } = await supabase.from("patient_documents").select("*");

  if (!clients) return {
    totalClients: 0, compliantCount: 0, warningCount: 0, criticalCount: 0,
    overallScore: 100, results: [], lastChecked: new Date().toISOString()
  };

  const results: ClientComplianceResult[] = clients.map(client => {
    const issues: ComplianceIssue[] = [];
    const isMinor = client.is_minor;
    const isAnon = Boolean(client.notes_anonymized_at);
    
    // R1 - GDPR
    if (!client.gdpr_consent_signed && !isAnon) {
      issues.push({
        ruleId: "R1",
        severity: "CRITICAL",
        message: "Acord GDPR nesemnat",
        law: "Reg. (UE) 2016/679, Legea 190/2018",
        action: "Solicită semnarea acordului GDPR la următoarea ședință.",
      });
    }

    // R2 - Contract
    const hasContract = docs?.some(d => d.client_id === client.id && d.document_type === "CONTRACT");
    if (!client.contract_url && !hasContract && !isAnon) {
      issues.push({
        ruleId: "R2",
        severity: "WARNING",
        message: "Contract de prestări servicii absent",
        law: "Legea 213/2004, Cod Deontologic CPR",
        action: "Generează și încarță contractul din fișa clientului.",
      });
    }

    // R3/R4 - Minor
    if (isMinor && !isAnon) {
      const hasParentAcord = docs?.some(d => d.client_id === client.id && d.document_type === "ACORD_PARINTI");
      if (!hasParentAcord) {
        issues.push({
          ruleId: "R3",
          severity: "CRITICAL",
          message: "Acord ambii părinți lipsă (minor)",
          law: "Legea 272/2004, Regulament CPR",
          action: "Încarcă acordul semnat de ambii părinți.",
        });
      }
    }

    // Score calculation (reusing logic from engine.ts if possible, but keeping it simple here)
    let deductions = 0;
    for (const i of issues) {
      if (i.severity === "CRITICAL") deductions += 35;
      else if (i.severity === "WARNING") deductions += 15;
    }
    const score = Math.max(0, 100 - deductions);
    
    return {
      clientId: client.id,
      clientName: client.full_name || "Client anonimizat",
      isMinor: !!isMinor,
      isAnonymized: isAnon,
      issues,
      score,
      status: issues.some(i => i.severity === "CRITICAL") ? "CRITICAL" : (score < 80 ? "WARNING" : "COMPLIANT")
    };
  });

  const compliantCount = results.filter(r => r.status === "COMPLIANT").length;
  const warningCount = results.filter(r => r.status === "WARNING").length;
  const criticalCount = results.filter(r => r.status === "CRITICAL").length;
  const overallScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 100;

  return {
    totalClients: results.length,
    compliantCount, warningCount, criticalCount,
    overallScore,
    results,
    lastChecked: new Date().toISOString()
  };
}
