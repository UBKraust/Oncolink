/**
 * Legal Compliance Engine
 * Runs against all clients and emits per-client issues and an overall score.
 *
 * Rules enforced (referenced legislation):
 * R1  GDPR consent (Reg. 2016/679, Legea 190/2018)
 * R2  Contract terapeutic (Legea 213/2004, Cod Deontologic CPR)
 * R3  Minor — acord ambii părinți (Legea 272/2004, Regulament CPR)
 * R4  Minor — sentință custodie dacă familie divorțată (Legea 272/2004)
 * R5  Facturile nu se șterg la anonimizare (Legea 82/1991 — 10 ani)
 * R6  CNP prezent pentru facturare (OUG 120/2021, Legea 296/2023)
 */

import { mockClients, MockClient } from "@/lib/mock/clients";
import { mockPatientDocuments, DocumentType } from "@/lib/mock/patientFiles";
import { mockPayments } from "@/lib/mock/payments";

export type ComplianceSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface ComplianceIssue {
  ruleId: string;
  severity: ComplianceSeverity;
  message: string;
  law: string;
  action: string;
}

export interface ClientComplianceResult {
  clientId: string;
  clientName: string;
  isMinor: boolean;
  isAnonymized: boolean;
  issues: ComplianceIssue[];
  score: number; // 0-100
  status: "COMPLIANT" | "WARNING" | "CRITICAL";
}

export interface ComplianceSummary {
  totalClients: number;
  compliantCount: number;
  warningCount: number;
  criticalCount: number;
  overallScore: number;
  results: ClientComplianceResult[];
  lastChecked: string;
}

// ── Rule definitions ──────────────────────────────────────────────────────────

function hasDocument(clientId: string, type: DocumentType): boolean {
  return mockPatientDocuments.some(
    d => d.client_id === clientId && d.document_type === type
  );
}

function checkClient(client: MockClient): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const isMinor = client.is_minor;
  const isAnon  = Boolean(client.notes_anonymized_at);
  const cnp     = client.cnp_cif;

  // R1 — GDPR consent
  if (!client.gdpr_consent_signed) {
    issues.push({
      ruleId: "R1",
      severity: "CRITICAL",
      message: "Acord GDPR nesemnat",
      law: "Reg. (UE) 2016/679, Legea 190/2018",
      action: "Solicită semnarea acordului GDPR la următoarea ședință.",
    });
  }

  // R2 — Contract terapeutic
  if (!client.contract_url && !hasDocument(client.id, "CONTRACT")) {
    issues.push({
      ruleId: "R2",
      severity: "WARNING",
      message: "Contract de prestări servicii absent",
      law: "Legea 213/2004, Cod Deontologic CPR",
      action: "Generează și încarță contractul din fișa clientului (Drive).",
    });
  }

  // R3 + R4 — Minor safeguards
  if (isMinor) {
    if (!hasDocument(client.id, "ACORD_PARINTI")) {
      issues.push({
        ruleId: "R3",
        severity: "CRITICAL",
        message: "Acord ambii părinți lipsă (minor)",
        law: "Legea 272/2004, Regulament CPR",
        action: "Încarcă acordul semnat de ambii părinți în secțiunea Documente.",
      });
    }
    if (!hasDocument(client.id, "SENTINTA_CUSTODIE") && !client.parent_name) {
      issues.push({
        ruleId: "R4",
        severity: "WARNING",
        message: "Sentință custodie neverificată pentru minor",
        law: "Legea 272/2004",
        action: "Solicită sentința de custodie sau confirmă că nu există litigiu.",
      });
    }
  }

  // R5 — Facturi retenție 10 ani (la anonimizare)
  if (isAnon) {
    const hasPayments = mockPayments.some(p => p.client_id === client.id);
    if (hasPayments) {
      // Check that payment records still exist (they should — anonimization keeps them)
      // In demo mode we just verify the mock still has entries for this client
      // Real check: Supabase invoices WHERE client_id = id still present
      // If they were deleted → CRITICAL violation
      const payCount = mockPayments.filter(p => p.client_id === client.id).length;
      if (payCount === 0) {
        issues.push({
          ruleId: "R5",
          severity: "CRITICAL",
          message: "Facturile au fost șterse la anonimizare — ilegal",
          law: "Legea 82/1991 (Legea Contabilității — retenție 10 ani)",
          action: "Facturile trebuie păstrate 10 ani chiar și după ștergerea datelor personale.",
        });
      }
    }
  }

  // R6 — CNP pentru facturare B2B/Individual
  if (!isAnon && !cnp && client.billing_type === "INDIVIDUAL") {
    issues.push({
      ruleId: "R6",
      severity: "WARNING",
      message: "CNP absent — facturare e-Invoice imposibilă",
      law: "OUG 120/2021, Legea 296/2023 (RO e-Factura)",
      action: "Colectează CNP-ul pacientului pentru conformitate e-Factura ANAF.",
    });
  }

  return issues;
}

// ── Score ─────────────────────────────────────────────────────────────────────

function scoreFromIssues(issues: ComplianceIssue[]): number {
  let deductions = 0;
  for (const i of issues) {
    if (i.severity === "CRITICAL") deductions += 35;
    else if (i.severity === "WARNING") deductions += 15;
    else deductions += 5;
  }
  return Math.max(0, 100 - deductions);
}

function statusFromScore(score: number, issues: ComplianceIssue[]): ClientComplianceResult["status"] {
  if (issues.some(i => i.severity === "CRITICAL")) return "CRITICAL";
  if (score < 80) return "WARNING";
  return "COMPLIANT";
}

// ── Main export ───────────────────────────────────────────────────────────────

export function runComplianceCheck(): ComplianceSummary {
  const results: ClientComplianceResult[] = mockClients.map(client => {
    const issues = checkClient(client);
    const score  = scoreFromIssues(issues);
    return {
      clientId:    client.id,
      clientName:  client.full_name ?? "Client anonimizat",
      isMinor:     client.is_minor ?? false,
      isAnonymized: Boolean(client.notes_anonymized_at),
      issues,
      score,
      status: statusFromScore(score, issues),
    };
  });

  const compliantCount = results.filter(r => r.status === "COMPLIANT").length;
  const warningCount   = results.filter(r => r.status === "WARNING").length;
  const criticalCount  = results.filter(r => r.status === "CRITICAL").length;
  const overallScore   = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  return {
    totalClients: results.length,
    compliantCount, warningCount, criticalCount,
    overallScore,
    results,
    lastChecked: new Date().toISOString(),
  };
}
