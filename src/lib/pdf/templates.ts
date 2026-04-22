/**
 * Client-side PDF templates using jsPDF.
 * Runs entirely in the browser — no server call needed.
 */

import type { jsPDF } from "jspdf";

function loadJsPDF(): Promise<typeof import("jspdf").jsPDF> {
  return import("jspdf").then((m) => m.jsPDF);
}

const MARGIN = 20;
const PAGE_W = 210; // A4 mm
const CONTENT_W = PAGE_W - MARGIN * 2;
const PRIMARY = "#1a3c5e";

function header(doc: jsPDF, title: string) {
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, PAGE_W, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Ce`ai Pățit? · Cabinet psihoterapie", MARGIN, 12);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 32);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, 35, PAGE_W - MARGIN, 35);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Pagina ${i} din ${pages}  ·  Generat de Ce`ai Pățit?  ·  ${new Date().toLocaleDateString("ro-RO")}`,
      MARGIN,
      290,
    );
  }
}

function kv(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text(label + ":", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(value || "—", CONTENT_W - 55);
  doc.text(lines, MARGIN + 55, y);
  return y + lines.length * 6 + 2;
}

function section(doc: jsPDF, y: number, title: string): number {
  if (y > 250) { doc.addPage(); y = 25; }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.text(title, MARGIN, y + 6);
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 8, PAGE_W - MARGIN, y + 8);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  return y + 14;
}

function para(doc: jsPDF, y: number, text: string): number {
  if (y > 260) { doc.addPage(); y = 25; }
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5.5 + 4;
}

export interface ContractData {
  contractNumber: string;
  startDate: string;
  clientName: string;
  clientCNP: string;
  clientAddress: string;
  therapistName: string;
  therapistCIF: string;
  therapistIBAN?: string;
  sessionPrice: number;

  // Minor specific
  isMinor?: boolean;
  parent1Name?: string;
  parent2Name?: string;
  parentsMaritalStatus?: string;
  courtSentenceNumber?: string;

  // B2B specific
  isB2B?: boolean;
  companyName?: string;
  companyCIF?: string;
  companyRegCom?: string;
  representativeName?: string;
  representativeRole?: string;

  // CAS specific
  isCas?: boolean;
  referralNumber?: string;
  referralDate?: string;
  referringDoctor?: string;
}

/**
 * Common Signature Block with large whitespace for digital signing (reMarkable/Tablet)
 */
function signatureBlock(doc: jsPDF, y: number, labelLeft: string, labelRight: string) {
  if (y > 230) { doc.addPage(); y = 30; }
  
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(labelLeft, MARGIN, y);
  doc.text(labelRight, PAGE_W - MARGIN - 60, y);
  
  y += 25; // Large signature whitespace
  
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, MARGIN + 60, y);
  doc.line(PAGE_W - MARGIN - 60, y, PAGE_W - MARGIN, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("(semnătură și parafă)", MARGIN, y);
  doc.text("(semnătură olografă digitală)", PAGE_W - MARGIN - 60, y);
  
  return y;
}

export async function generateContract(data: ContractData): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let title = "Contract de Prestări Servicii Psihologice";
  if (data.isB2B) title = "Contract de servicii de asistență/consultanță psihologică";
  if (data.isCas) title = "Consimțământ Informat - Servicii Decontate CAS";

  header(doc, title);
  doc.setFontSize(9);
  doc.text(`Nr. ${data.contractNumber} / Data: ${data.startDate}`, PAGE_W - MARGIN - 50, 25);

  let y = 44;

  // 1. Părți Contractante
  y = section(doc, y, "Părțile contractante");
  y = kv(doc, y, "Prestator", data.therapistName);
  y = kv(doc, y, "CIF", data.therapistCIF);
  if (data.therapistIBAN) y = kv(doc, y, "IBAN", data.therapistIBAN);
  
  y += 4;
  
  if (data.isB2B) {
    y = kv(doc, y, "Beneficiar (Firmă)", data.companyName || "—");
    y = kv(doc, y, "CUI/CIF", data.companyCIF || "—");
    y = kv(doc, y, "Reg. Com.", data.companyRegCom || "—");
    y = kv(doc, y, "Reprezentat prin", `${data.representativeName} (${data.representativeRole})`);
  } else {
    y = kv(doc, y, "Beneficiar (Pacient)", data.clientName);
    y = kv(doc, y, "CNP", data.clientCNP);
    y = kv(doc, y, "Adresă", data.clientAddress);
    if (data.isMinor) {
      y = kv(doc, y, "Reprezentant legal 1", data.parent1Name || "—");
      if (data.parent2Name) y = kv(doc, y, "Reprezentant legal 2", data.parent2Name);
    }
  }

  // 2. Obiectul Contractului
  y += 4;
  y = section(doc, y, "Obiectul contractului");
  if (data.isCas) {
    y = para(doc, y, `Prezentul acord reglementează prestarea serviciilor psihologice decontate prin Casa de Asigurări de Sănătate în baza biletului de trimitere nr. ${data.referralNumber || "—"} din data de ${data.referralDate || "—"} emis de Dr. ${data.referringDoctor || "—"}.`);
    y = para(doc, y, "Beneficiarul declară că a fost informat cu privire la drepturile și obligațiile ce decurg din calitatea de asigurat.");
  } else {
    y = para(doc, y, `Prestatorul se angajează să furnizeze servicii de ${data.isB2B ? "consultanță psihologică" : "psihoterapie individuală"} Beneficiarului, conform Legii nr. 213/2004 și Codului Deontologic al profesiei de psiholog cu drept de liberă practică.`);
  }

  // 3. Clauze Speciale (Minor / B2B)
  if (data.isMinor) {
    y = section(doc, y, "Consimțământ pentru minori (Legea 272/2004)");
    y = para(doc, y, "Părinții / Reprezentanții legali declară că dețin autoritatea părintească și își exprimă acordul pentru prestarea serviciilor psihologice minorului conform Legii 272/2004.");
    if (data.parentsMaritalStatus !== "CASATORITI" && data.courtSentenceNumber) {
      y = para(doc, y, `Conform sentinței judecătorești nr. ${data.courtSentenceNumber}, custodia este exercitată conform dispozițiilor legale aferente.`);
    }
  }

  // 4. Onorariu și Plată
  if (!data.isCas) {
    y = section(doc, y, "Tarif și modalitate de plată");
    y = kv(doc, y, "Tarif", `${data.sessionPrice.toFixed(2)} RON / ședință (scutit TVA)`);
    y = para(doc, y, "Plata se efectuează la data emiterii facturii prin metodele agreate (Transfer, Card, Numerar).");
  }

  // 5. Confidențialitate
  y = section(doc, y, "Confidențialitate și GDPR");
  y = para(doc, y, "Datele sunt prelucrate conform Regulamentului UE 2016/679. Notele clinice sunt protejate prin criptare end-to-end. Secretul profesional poate fi ridicat doar cu acordul pacientului sau în condițiile prevăzute de lege (pericol iminent).");

  // Signatures
  let leftLabel = "Prestator (Terapeut)";
  let rightLabel = data.isB2B ? "Beneficiar (Firmă)" : (data.isMinor ? "Reprezentanți Legali" : "Beneficiar (Pacient)");
  
  signatureBlock(doc, y, leftLabel, rightLabel);

  footer(doc);
  const fileName = data.isB2B ? `contract-b2b-${data.companyName}` : `contract-${data.clientName}`;
  doc.save(`${fileName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

/**
 * Separate GDPR Consent Template
 */
export async function generateGdprConsent(data: { clientName: string; clientCNP: string; therapistName: string; date: string }): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  header(doc, "Acord de Prelucrare Date (GDPR)");

  let y = 44;
  y = section(doc, y, "Identificarea persoanei");
  y = kv(doc, y, "Nume", data.clientName);
  y = kv(doc, y, "CNP", data.clientCNP);

  y = section(doc, y, "Consimțământ");
  y = para(doc, y, "Prin prezenta îmi dau acordul ca datele mele cu caracter personal, inclusiv datele de sănătate, să fie prelucrate de către prestator în scopul exclusiv al desfășurării procesului terapeutic.");
  
  signatureBlock(doc, y, "Terapeut", "Pacient / Tutore");

  footer(doc);
  doc.save(`gdpr-${data.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
