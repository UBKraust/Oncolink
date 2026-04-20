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
  doc.text("Oncolink · Cabinet psihoterapie", MARGIN, 12);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
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
      `Pagina ${i} din ${pages}  ·  Generat de Oncolink  ·  ${new Date().toLocaleDateString("ro-RO")}`,
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
  const lines = doc.splitTextToSize(value, CONTENT_W - 50);
  doc.text(lines, MARGIN + 50, y);
  return y + lines.length * 6 + 2;
}

function section(doc: jsPDF, y: number, title: string): number {
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
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5.5 + 3;
}

export interface ContractData {
  clientName: string;
  clientCNP: string;
  clientAddress: string;
  therapistName: string;
  therapistCIF: string;
  sessionPrice: number;
  sessionCount?: number;
  startDate: string;
}

export async function generateContract(data: ContractData): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  header(doc, "Contract de Prestări Servicii Psihologice");

  let y = 44;
  y = section(doc, y, "Părțile contractante");
  y = kv(doc, y, "Prestator", data.therapistName);
  y = kv(doc, y, "CIF", data.therapistCIF);
  y += 4;
  y = kv(doc, y, "Beneficiar", data.clientName);
  y = kv(doc, y, "CNP", data.clientCNP);
  y = kv(doc, y, "Adresă", data.clientAddress);
  y += 6;

  y = section(doc, y, "Obiectul contractului");
  y = para(doc, y,
    `Prestatorul se angajează să furnizeze servicii de psihoterapie individuală Beneficiarului, ` +
    `în cadrul cabinetului propriu sau online, conform Legii nr. 213/2004 și normelor Colegiului ` +
    `Psihologilor din România.`,
  );

  y = section(doc, y, "Tarif și modalitate de plată");
  y = kv(doc, y, "Tarif / ședință", `${data.sessionPrice.toFixed(2)} RON (TVA 0%, scutit)`);
  y = kv(doc, y, "U.M.", "ședință — 50 minute");
  y = para(doc, y,
    `Plata se efectuează la data emiterii facturii, prin transfer bancar sau link de plată online ` +
    `furnizat de Prestator (SmartBill). Nu este necesară casă de marcat.`,
  );

  y = section(doc, y, "Confidențialitate și GDPR");
  y = para(doc, y,
    `Prestatorul prelucrează datele personale ale Beneficiarului în conformitate cu GDPR ` +
    `(Regulamentul UE 2016/679) și legislația română aplicabilă, exclusiv în scopul furnizării ` +
    `serviciilor contractate. Notele clinice sunt criptate end-to-end și nu sunt partajate cu ` +
    `terți. Beneficiarul are dreptul de acces, rectificare, ștergere și portabilitate a datelor.`,
  );

  y = section(doc, y, "Durata contractului");
  y = kv(doc, y, "Data inițierii", data.startDate);
  y = para(doc, y,
    `Contractul este valabil pe perioadă nedeterminată și poate fi reziliat de oricare parte cu ` +
    `un preaviz de 7 zile.`,
  );

  y += 12;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("Semnătură Prestator", MARGIN, y);
  doc.text("Semnătură Beneficiar", PAGE_W - MARGIN - 50, y);
  y += 16;
  doc.setDrawColor(0);
  doc.line(MARGIN, y, MARGIN + 50, y);
  doc.line(PAGE_W - MARGIN - 50, y, PAGE_W - MARGIN, y);

  footer(doc);
  doc.save(`contract-${data.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export interface GdprConsentData {
  clientName: string;
  clientCNP: string;
  therapistName: string;
  date: string;
}

export async function generateGdprConsent(data: GdprConsentData): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  header(doc, "Acord de Prelucrare Date cu Caracter Personal (GDPR)");

  let y = 44;
  y = section(doc, y, "Identificarea persoanei vizate");
  y = kv(doc, y, "Nume", data.clientName);
  y = kv(doc, y, "CNP", data.clientCNP);
  y += 6;

  y = section(doc, y, "Temeiul legal");
  y = para(doc, y,
    `Prelucrarea se realizează în baza articolului 6 alin. (1) lit. (a) — consimțământul explicit ` +
    `al persoanei vizate — și articolului 9 alin. (2) lit. (h) din GDPR, ` +
    `privind prelucrarea datelor de sănătate în scop terapeutic.`,
  );

  y = section(doc, y, "Categorii de date prelucrate");
  y = para(doc, y,
    `• Date de identificare: nume, CNP, adresă, email, telefon\n` +
    `• Date de sănătate: note clinice criptate, istoricul ședințelor\n` +
    `• Date fiscale: CNP/CIF pentru facturare`,
  );

  y = section(doc, y, "Scopul și durata prelucrării");
  y = para(doc, y,
    `Datele sunt prelucrate exclusiv în scopul furnizării serviciilor de psihoterapie și al ` +
    `îndeplinirii obligațiilor fiscale și legale. Datele sunt păstrate pe durata relației ` +
    `contractuale și 5 ani ulterior, conform Codului Fiscal român. La cerere, datele ` +
    `personale pot fi anonimizate ("Uitat") cu păstrarea istoricului fiscal (facturi).`,
  );

  y = section(doc, y, "Drepturile tale");
  y = para(doc, y,
    `Ai dreptul de: acces (Art. 15), rectificare (Art. 16), ștergere (Art. 17), ` +
    `restricționare (Art. 18), portabilitate (Art. 20), opoziție (Art. 21). ` +
    `Poți depune plângere la ANSPDCP (www.dataprotection.ro).`,
  );

  y += 10;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("Declar că am citit și înțeles cele de mai sus și îmi exprim consimțământul.", MARGIN, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${data.date}`, MARGIN, y);
  y += 14;
  doc.text("Semnătură:", MARGIN, y);
  doc.line(MARGIN + 28, y, MARGIN + 80, y);

  footer(doc);
  doc.save(`gdpr-consent-${data.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
