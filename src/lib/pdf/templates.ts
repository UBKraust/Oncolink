/**
 * Client-side PDF templates using jsPDF.
 * Runs entirely in the browser — no server call needed.
 */

import type { jsPDF } from "jspdf";
import type { ContractPdfData, GeneratedPdfResult, TemplateType } from "@/lib/contracts/types";

function loadJsPDF(): Promise<typeof import("jspdf").jsPDF> {
  return import("jspdf").then((m) => m.jsPDF);
}

const MARGIN = 20;
const PAGE_W = 210; // A4 mm
const CONTENT_W = PAGE_W - MARGIN * 2;
const PRIMARY = "#1a3c5e";
const BORDER = "#d9e2ec";
const SOFT_BG = "#f6f8fb";
let pageHeaderRenderer: ((doc: jsPDF) => void) | null = null;

function ensurePage(doc: jsPDF, y: number, threshold = 260) {
  if (y > threshold) {
    doc.addPage();
    pageHeaderRenderer?.(doc);
    return 58;
  }
  return y;
}

function drawPageHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, PAGE_W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Ce-ai Pățit? · Cabinet psihoterapie", MARGIN, 12);

  doc.setTextColor(36, 45, 56);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 37);
  if (subtitle) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 124, 147);
    doc.text(subtitle, MARGIN, 43);
  }
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, 48, PAGE_W - MARGIN, 48);
}

function header(doc: jsPDF, title: string, subtitle?: string) {
  pageHeaderRenderer = (activeDoc: jsPDF) => drawPageHeader(activeDoc, title, subtitle);
  drawPageHeader(doc, title, subtitle);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Pagina ${i} din ${pages}  ·  Generat de Ce\`ai Pățit?  ·  ${new Date().toLocaleDateString("ro-RO")}`,
      MARGIN,
      290,
    );
  }
}

function section(doc: jsPDF, y: number, title: string): number {
  y = ensurePage(doc, y, 250);
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

function labelValue(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFontSize(8);
  doc.setTextColor(107, 124, 147);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x, y);
  doc.setFontSize(10);
  doc.setTextColor(36, 45, 56);
  doc.setFont("helvetica", "normal");
  doc.text(value, x, y + 5);
}

function metaCard(doc: jsPDF, numberLabel: string, docNumber: string, dateLabel: string, dateValue: string) {
  doc.setFillColor(SOFT_BG);
  doc.setDrawColor(BORDER);
  doc.roundedRect(MARGIN, 54, CONTENT_W, 19, 3, 3, "FD");
  labelValue(doc, MARGIN + 4, 60, numberLabel, docNumber);
  labelValue(doc, MARGIN + 68, 60, dateLabel, dateValue);
  labelValue(doc, MARGIN + 112, 60, "Locul încheierii", "București");
}

function infoBox(doc: jsPDF, y: number, text: string): number {
  y = ensurePage(doc, y, 245);
  doc.setFillColor(246, 248, 251);
  doc.setDrawColor(BORDER);
  const lines = doc.splitTextToSize(text, CONTENT_W - 10);
  const height = 8 + lines.length * 5;
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 3, 3, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 124, 147);
  doc.setFont("helvetica", "italic");
  doc.text(lines, MARGIN + 5, y + 6);
  return y + height + 5;
}

function para(doc: jsPDF, y: number, text: string): number {
  y = ensurePage(doc, y);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5.5 + 4;
}

function bulletList(doc: jsPDF, y: number, items: string[]): number {
  return items.reduce((nextY, item) => para(doc, nextY, `• ${item}`), y);
}

function safeValue(value?: string | null, fallback = "________________"): string {
  return value?.trim() || fallback;
}

function formatMoney(value: number) {
  return `${value.toFixed(2)} lei`;
}

function normalizePdfFileName(value: string) {
  return `${value.replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

function therapistRoleLabel(cprCode?: string) {
  if (!cprCode?.trim()) return "psiholog cu drept de liberă practică";
  return `psiholog cu drept de liberă practică, cod CPR ${cprCode}`;
}

function signatureBlock(doc: jsPDF, y: number, labelLeft: string, labelRight: string, noteRight?: string) {
  y = ensurePage(doc, y, 230);
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(labelLeft, MARGIN, y);
  doc.text(labelRight, PAGE_W - MARGIN - 60, y);

  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, MARGIN + 60, y);
  doc.line(PAGE_W - MARGIN - 60, y, PAGE_W - MARGIN, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("(semnătură și parafă)", MARGIN, y);
  doc.text(noteRight || "(semnătură)", PAGE_W - MARGIN - 60, y);

  return y;
}

function signatureBlockTriple(
  doc: jsPDF,
  y: number,
  leftLabel: string,
  centerLabel: string,
  rightLabel: string,
  centerNote = "(semnătură)",
  rightNote = "(semnătură / acord, dacă este cazul)",
) {
  y = ensurePage(doc, y, 220);
  y += 10;

  const columnWidth = 48;
  const gap = 8;
  const startX = MARGIN;
  const centerX = startX + columnWidth + gap;
  const rightX = centerX + columnWidth + gap;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(leftLabel, startX, y);
  doc.text(centerLabel, centerX, y);
  doc.text(rightLabel, rightX, y);

  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(startX, y, startX + columnWidth, y);
  doc.line(centerX, y, centerX + columnWidth, y);
  doc.line(rightX, y, rightX + columnWidth, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("(semnătură și parafă)", startX, y);
  doc.text(centerNote, centerX, y);
  doc.text(rightNote, rightX, y);

  return y;
}

function writeDocumentMeta(doc: jsPDF, numberLabel: string, docNumber: string, dateLabel: string, dateValue: string) {
  metaCard(doc, numberLabel, docNumber, dateLabel, dateValue);
}

function resolveTemplateType(data: ContractPdfData): TemplateType {
  if (data.templateType) return data.templateType;
  if (data.isCas) return "CAS";
  if (data.isB2B) return "B2B";
  if (data.isMinor) return "MINOR";
  return "STANDARD";
}

function drawStatusBadge(doc: jsPDF, statusLabel: string, isDraft: boolean) {
  const x = PAGE_W - MARGIN - 48;
  const y = 31;
  doc.setFillColor(isDraft ? 254 : 240, isDraft ? 226 : 249, isDraft ? 226 : 250);
  doc.setDrawColor(isDraft ? 239 : 45, isDraft ? 68 : 125, isDraft ? 68 : 50);
  doc.roundedRect(x, y, 48, 10, 2, 2, "FD");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isDraft ? 185 : 36, isDraft ? 28 : 45, isDraft ? 28 : 56);
  doc.text(statusLabel, x + 24, y + 6.5, { align: "center" });
}

function drawDraftWatermark(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setTextColor(240, 146, 146);
    doc.setFontSize(34);
    doc.setFont("helvetica", "bold");
    doc.text("DRAFT - NEEMIS", PAGE_W / 2, 170, {
      align: "center",
      angle: 28,
    });
  }
}

function writeFooterMetadata(doc: jsPDF, templateVersion: string, statusLabel: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`Template: ${templateVersion}  ·  Status: ${statusLabel}`, PAGE_W - MARGIN, 285, {
      align: "right",
    });
  }
}

export async function generateContract(data: ContractPdfData): Promise<GeneratedPdfResult> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const templateType = resolveTemplateType(data);
  const isDraft = data.documentStatus === "DRAFT";

  const title = templateType === "CAS"
    ? "Consimțământ Informat pentru Servicii Psihologice"
    : templateType === "B2B"
      ? "Contract de Prestări Servicii Psihologice / Consultanță"
      : templateType === "MINOR"
        ? "Contract de Prestări Servicii Psihologice pentru Minor"
        : "Contract de Prestări Servicii Psihologice";

  const subtitle = templateType === "CAS"
    ? "Model CAS · Consimțământ informat"
    : templateType === "B2B"
      ? "Model Business · B2B / Firmă"
      : templateType === "MINOR"
      ? "Model Minor · Legea 272/2004"
      : "Model Standard · Client individual adult";

  header(doc, title, subtitle);
  drawStatusBadge(doc, data.statusLabel, isDraft);
  writeDocumentMeta(
    doc,
    templateType === "CAS" ? "Document nr." : "Contract nr.",
    data.contractNumber,
    "Data:",
    data.startDate,
  );
  doc.setProperties({
    title,
    subject: `${data.statusLabel} · Template ${data.templateVersion}`,
    creator: "Ce-ai Pățit?",
    keywords: `${templateType}, ${data.templateVersion}, ${data.documentStatus}`,
  });

  let y = 79;

  const therapistEntity = safeValue(data.therapistPracticeName);
  const therapistRole = therapistRoleLabel(data.therapistCPRCode);
  const therapistAddress = safeValue(data.therapistPracticeAddress);
  const therapistPhone = safeValue(data.therapistPracticePhone);
  const therapistEmail = safeValue(data.therapistPracticeEmail);
  const therapistName = safeValue(data.therapistName);
  const therapistCif = safeValue(data.therapistCIF);
  const sessionPrice = formatMoney(data.sessionPrice);
  const paymentMethod = data.therapistIBAN
    ? `transfer bancar în contul ${data.therapistIBAN}`
    : "transfer bancar sau altă metodă convenită de Părți";

  y = infoBox(
    doc,
    y,
    isDraft
      ? `Document de previzualizare. Status: ${data.statusLabel}. Numărul afișat este placeholder și nu a fost emis în registru.`
      : `Document emis și generat din șablonul contractual intern al cabinetului. Template: ${data.templateVersion}.`,
  );

  if (templateType === "STANDARD") {
    y = section(doc, y, "1. Părțile contractante");
    y = para(doc, y, `1.1. Prestatorul: ${therapistEntity}, cu CUI ${therapistCif}, având sediul profesional în ${therapistAddress}, reprezentat prin ${therapistName}, în calitate de ${therapistRole}, telefon ${therapistPhone}, e-mail ${therapistEmail}, denumit în continuare Prestatorul.`);
    y = para(doc, y, `1.2. Beneficiarul: ${safeValue(data.clientName)}, CNP ${safeValue(data.clientCNP)}, domiciliat/ă în ${safeValue(data.clientAddress)}, identificat/ă cu CI seria ${safeValue(data.clientIdSeries, "____")} nr. ${safeValue(data.clientIdNumber, "______")}, telefon ${safeValue(data.clientPhone, "—")}, e-mail ${safeValue(data.clientEmail, "—")}, denumit/ă în continuare Beneficiarul.`);
    y = para(doc, y, "Prestatorul și Beneficiarul vor fi denumiți împreună Părțile.");

    y = section(doc, y, "2. Obiectul contractului");
    y = para(doc, y, "2.1. Obiectul prezentului contract îl reprezintă prestarea de către Prestator a serviciilor de psihoterapie / consiliere psihologică, în beneficiul Beneficiarului.");
    y = para(doc, y, "2.2. Serviciile pot include, după caz: evaluare psihologică, consiliere psihologică, psihoterapie, intervenții de autoreglare emoțională, orientare psihologică și alte activități specifice competențelor profesionale ale Prestatorului.");
    y = para(doc, y, "2.3. Prezentul contract nu garantează un rezultat terapeutic prestabilit. Procesul psihologic/psihoterapeutic depinde de participarea activă a Beneficiarului, de frecvența ședințelor și de particularitățile individuale ale acestuia.");

    y = section(doc, y, "3. Durata contractului");
    y = para(doc, y, `3.1. Prezentul contract se încheie pe perioada colaborării dintre Părți, începând cu data de ${data.startDate}.`);
    y = para(doc, y, "3.2. O ședință are durata standard de 50 de minute, cu excepția cazului în care Părțile convin altfel.");
    y = para(doc, y, "3.3. Frecvența ședințelor se stabilește de comun acord între Prestator și Beneficiar.");

    y = section(doc, y, "4. Prețul serviciilor și modalitatea de plată");
    y = para(doc, y, `4.1. Tariful unei ședințe este de ${sessionPrice}.`);
    y = para(doc, y, `4.2. Plata se efectuează prin ${paymentMethod}.`);
    y = para(doc, y, "4.3. Plata se face la finalul ședinței sau conform acordului stabilit între Părți.");
    y = para(doc, y, "4.4. În cazul în care Beneficiarul nu anulează sau nu reprogramează ședința cu minimum 24 de ore înainte, Prestatorul poate considera ședința datorată integral.");

    y = section(doc, y, "5. Drepturile și obligațiile Prestatorului");
    y = bulletList(doc, y, [
      "să presteze serviciile cu profesionalism, responsabilitate și respect față de Beneficiar;",
      "să informeze Beneficiarul cu privire la natura serviciilor, limitele procesului terapeutic și modalitatea de desfășurare;",
      "să respecte confidențialitatea informațiilor obținute în cadrul ședințelor;",
      "să respecte normele profesionale și deontologice aplicabile profesiei;",
      "să protejeze datele cu caracter personal ale Beneficiarului.",
    ]);
    y = para(doc, y, "Prestatorul are dreptul să primească plata pentru serviciile prestate, să stabilească limite profesionale clare, să întrerupă colaborarea în caz de comportament agresiv sau abuziv și să recomande consultarea altui specialist, dacă situația o impune.");

    y = section(doc, y, "6. Drepturile și obligațiile Beneficiarului");
    y = para(doc, y, "Beneficiarul are dreptul să primească informații clare despre serviciile prestate, să beneficieze de un cadru sigur, confidențial și respectuos, să întrerupă colaborarea cu notificarea Prestatorului și să adreseze întrebări privind procesul terapeutic.");
    y = bulletList(doc, y, [
      "să ofere informații corecte și relevante pentru procesul terapeutic;",
      "să respecte programările stabilite;",
      "să achite serviciile conform prezentului contract;",
      "să respecte cadrul profesional și limitele relației terapeutice.",
    ]);

    y = section(doc, y, "7. Confidențialitate");
    y = para(doc, y, "7.1. Informațiile comunicate de Beneficiar în cadrul ședințelor sunt confidențiale.");
    y = para(doc, y, "7.2. Confidențialitatea poate fi limitată doar în cazurile prevăzute de lege sau în situații în care există risc major pentru viața, integritatea sau siguranța Beneficiarului ori a altor persoane.");
    y = para(doc, y, "7.3. Prestatorul nu va divulga informații despre Beneficiar către terți fără acordul scris al acestuia, cu excepția cazurilor prevăzute de lege.");

    y = section(doc, y, "8. Protecția datelor personale");
    y = para(doc, y, "8.1. Beneficiarul este informat că datele sale personale sunt prelucrate exclusiv în scopul prestării serviciilor psihologice, al evidenței contractuale și al îndeplinirii obligațiilor legale.");
    y = para(doc, y, "8.2. Datele pot include: nume, prenume, CNP, adresă, telefon, e-mail, date privind starea psihologică și informații relevante pentru procesul terapeutic.");
    y = para(doc, y, "8.3. Beneficiarul are dreptul de acces, rectificare, ștergere, restricționare și opoziție, în condițiile legislației aplicabile.");

    y = section(doc, y, "9. Încetarea contractului");
    y = bulletList(doc, y, [
      "prin acordul Părților;",
      "prin expirarea duratei stabilite;",
      "prin denunțare unilaterală de către oricare Parte;",
      "prin imposibilitatea obiectivă de continuare a serviciilor;",
      "în cazul încălcării grave a obligațiilor contractuale.",
    ]);

    y = section(doc, y, "10. Litigii");
    y = para(doc, y, "Orice neînțelegere se va soluționa pe cale amiabilă. Dacă acest lucru nu este posibil, litigiul va fi soluționat de instanțele competente din România.");

    y = section(doc, y, "11. Dispoziții finale");
    y = para(doc, y, "11.1. Prezentul contract intră în vigoare la data semnării de către ambele Părți.");
    y = para(doc, y, "11.2. Contractul se semnează în două exemplare, câte unul pentru fiecare Parte.");
  }

  if (templateType === "MINOR") {
    y = section(doc, y, "1. Părțile contractante");
    y = para(doc, y, `1.1. Prestatorul: ${therapistEntity}, cu CUI ${therapistCif}, având sediul profesional în ${therapistAddress}, reprezentat prin ${therapistName}, în calitate de ${therapistRole}, telefon ${therapistPhone}, e-mail ${therapistEmail}, denumit în continuare Prestatorul.`);
    y = para(doc, y, `1.2. Reprezentantul legal al minorului: ${safeValue(data.parent1Name)}, CNP ${safeValue(data.parentCNP, "—")}, domiciliat/ă în ${safeValue(data.parentAddress, data.clientAddress)}, identificat/ă cu CI seria ${safeValue(data.parentIdSeries, "____")} nr. ${safeValue(data.parentIdNumber, "______")}, telefon ${safeValue(data.parentPhone, "—")}, e-mail ${safeValue(data.parentEmail, "—")}, în calitate de părinte / reprezentant legal, denumit/ă în continuare Reprezentantul legal.`);
    y = para(doc, y, `1.3. Beneficiarul minor: ${safeValue(data.clientName)}, CNP ${safeValue(data.clientCNP)}, născut/ă la data de ${safeValue(data.clientBirthDate, "____________")}, domiciliat/ă în ${safeValue(data.clientAddress)}, denumit/ă în continuare Beneficiarul minor.`);

    y = section(doc, y, "2. Temeiul și principiile contractului");
    y = para(doc, y, "2.1. Prezentul contract se încheie cu respectarea legislației aplicabile privind protecția și promovarea drepturilor copilului, inclusiv principiul interesului superior al copilului.");
    y = para(doc, y, "2.2. Serviciile psihologice se vor desfășura într-un cadru sigur, respectuos și adaptat vârstei, nivelului de dezvoltare și nevoilor Beneficiarului minor.");
    y = para(doc, y, "2.3. Reprezentantul legal declară că are dreptul legal de a solicita și aproba serviciile psihologice pentru Beneficiarul minor.");

    y = section(doc, y, "3. Obiectul contractului");
    y = para(doc, y, "3.1. Obiectul contractului îl reprezintă prestarea de către Prestator a serviciilor psihologice pentru Beneficiarul minor.");
    y = para(doc, y, "3.2. Serviciile pot include: evaluare psihologică, consiliere, psihoterapie, intervenții de autoreglare emoțională, sprijin pentru adaptare, comunicare familială și alte activități specifice.");
    y = para(doc, y, "3.3. Prestatorul nu garantează un rezultat prestabilit. Evoluția procesului depinde de participarea minorului, de sprijinul familial și de continuitatea intervenției.");

    y = section(doc, y, "4. Consimțământul reprezentantului legal");
    y = para(doc, y, "4.1. Reprezentantul legal își exprimă acordul informat pentru ca Beneficiarul minor să participe la serviciile psihologice oferite de Prestator.");
    y = para(doc, y, "4.2. Reprezentantul legal declară că a fost informat cu privire la natura serviciilor, limitele confidențialității, durata estimativă, costuri și modalitatea de desfășurare.");
    y = para(doc, y, "4.3. În cazul în care există hotărâri judecătorești, restricții privind autoritatea părintească sau alte situații juridice relevante, Reprezentantul legal are obligația de a informa Prestatorul înainte de începerea serviciilor.");

    y = section(doc, y, "5. Participarea minorului");
    y = para(doc, y, "5.1. Prestatorul va explica Beneficiarului minor, într-un limbaj adaptat vârstei, scopul și regulile întâlnirilor.");
    y = para(doc, y, "5.2. Participarea minorului trebuie să respecte demnitatea, ritmul și limitele emoționale ale acestuia.");
    y = para(doc, y, "5.3. Minorul nu va fi forțat să comunice informații pentru care nu este pregătit, cu excepția situațiilor în care siguranța lui sau a altor persoane este în pericol.");

    y = section(doc, y, "6. Durata contractului");
    y = para(doc, y, `6.1. Contractul se încheie pe perioada colaborării dintre Părți, începând cu data de ${data.startDate}.`);
    y = para(doc, y, "6.2. O ședință are durata de 50 de minute.");
    y = para(doc, y, "6.3. Numărul, frecvența și durata ședințelor pot fi ajustate în funcție de nevoile minorului și de acordul Părților.");

    y = section(doc, y, "7. Prețul și modalitatea de plată");
    y = para(doc, y, `7.1. Tariful unei ședințe este de ${sessionPrice}.`);
    y = para(doc, y, `7.2. Plata se efectuează prin ${paymentMethod}.`);
    y = para(doc, y, "7.3. Ședințele anulate cu mai puțin de 24 de ore înainte pot fi facturate integral, cu excepția unor situații justificate.");

    y = section(doc, y, "8. Confidențialitate");
    y = para(doc, y, "8.1. Informațiile comunicate de minor în cadrul ședințelor sunt confidențiale.");
    y = para(doc, y, "8.2. Prestatorul poate comunica Reprezentantului legal informații generale despre evoluția procesului, recomandări și aspecte relevante pentru sprijinirea minorului, fără a divulga automat conținutul complet al ședințelor.");
    y = para(doc, y, "8.3. Confidențialitatea poate fi limitată dacă există risc pentru viața, sănătatea, integritatea sau siguranța minorului ori a altor persoane.");
    y = para(doc, y, "8.4. În cazuri de abuz, neglijare, violență sau risc major, Prestatorul poate avea obligația legală de a sesiza autoritățile competente.");

    y = section(doc, y, "9. Protecția datelor personale ale minorului");
    y = para(doc, y, "9.1. Datele personale ale minorului și ale Reprezentantului legal sunt prelucrate în scopul prestării serviciilor psihologice și al îndeplinirii obligațiilor legale.");
    y = para(doc, y, "9.2. Datele pot include: nume, prenume, CNP, adresă, telefon, e-mail, informații familiale, informații psihologice și alte date relevante.");
    y = para(doc, y, "9.3. Reprezentantul legal își exprimă acordul pentru prelucrarea datelor minorului în scopul prezentului contract.");

    y = section(doc, y, "10. Obligațiile reprezentantului legal");
    y = bulletList(doc, y, [
      "să furnizeze informații corecte și complete privind minorul;",
      "să informeze Prestatorul despre situații familiale, medicale sau juridice relevante;",
      "să respecte programările;",
      "să achite serviciile conform contractului;",
      "să nu exercite presiune asupra minorului privind conținutul ședințelor;",
      "să sprijine procesul terapeutic în limitele recomandărilor Prestatorului.",
    ]);

    y = section(doc, y, "11. Încetarea contractului");
    y = bulletList(doc, y, [
      "prin acordul Părților;",
      "la solicitarea Reprezentantului legal;",
      "dacă Prestatorul consideră că intervenția nu mai este adecvată;",
      "în caz de încălcare gravă a cadrului profesional;",
      "prin imposibilitatea continuării serviciilor.",
    ]);

    y = section(doc, y, "12. Dispoziții finale");
    y = para(doc, y, "12.1. Prezentul contract intră în vigoare la data semnării.");
    y = para(doc, y, "12.2. Contractul se semnează în două exemplare, câte unul pentru fiecare Parte.");
  }

  if (templateType === "B2B") {
    y = section(doc, y, "1. Părțile contractante");
    y = para(doc, y, `1.1. Prestatorul: ${therapistEntity}, cu CUI ${therapistCif}, având sediul profesional în ${therapistAddress}, reprezentat prin ${therapistName}, în calitate de ${therapistRole}, telefon ${therapistPhone}, e-mail ${therapistEmail}, denumit în continuare Prestatorul.`);
    y = para(doc, y, `1.2. Beneficiarul: ${safeValue(data.companyName)}, cu CUI ${safeValue(data.companyCIF)}, nr. Reg. Comerțului ${safeValue(data.companyRegCom)}, cu sediul social în ${safeValue(data.companyAddress, data.clientAddress)}, cont IBAN ${safeValue(data.companyIBAN, "—")}, deschis la ${safeValue(data.companyBank, "—")}, reprezentată legal prin ${safeValue(data.representativeName)}, având funcția de ${safeValue(data.representativeRole)}, e-mail ${safeValue(data.representativeEmail, data.clientEmail)}, denumită în continuare Beneficiarul.`);

    y = section(doc, y, "2. Obiectul contractului");
    y = para(doc, y, "2.1. Obiectul prezentului contract îl reprezintă prestarea de către Prestator a serviciilor de consiliere psihologică, workshopuri, traininguri, intervenții de wellbeing organizațional sau alte servicii profesionale similare pentru angajații / colaboratorii Beneficiarului.");
    y = para(doc, y, "2.2. Serviciile pot include sesiuni individuale de consiliere psihologică, workshopuri, traininguri de autoreglare emoțională, evaluări non-diagnostice și consultanță privind sănătatea emoțională în organizație.");
    y = para(doc, y, "2.3. Serviciile vor fi prestate la sediul Beneficiarului, online sau în alt spațiu agreat de Părți.");
    y = para(doc, y, "2.4. Prezentul contract nu are ca obiect servicii medicale de urgență, expertiză psihologică judiciară sau evaluări psihologice obligatorii pentru angajare, cu excepția cazului în care Părțile stabilesc expres altfel și Prestatorul are competența necesară.");

    y = section(doc, y, "3. Beneficiarii finali ai serviciilor");
    y = para(doc, y, "3.1. Beneficiarii finali pot fi angajații, colaboratorii sau membrii echipei Beneficiarului.");
    y = para(doc, y, "3.2. Beneficiarul se obligă să informeze participanții că serviciile psihologice sunt confidențiale și că participarea nu trebuie folosită ca instrument de evaluare profesională, control disciplinar sau presiune internă.");
    y = para(doc, y, "3.3. În cazul ședințelor individuale, conținutul discuțiilor dintre Prestator și participant rămâne confidențial. Beneficiarul nu va solicita detalii privind conținutul personal al ședințelor.");

    y = section(doc, y, "4. Confidențialitatea față de angajator");
    y = para(doc, y, "4.1. Prestatorul poate transmite Beneficiarului doar informații agregate, anonimizate sau administrative, cum ar fi: număr de sesiuni realizate, prezență/absență, teme generale de wellbeing și recomandări organizaționale generale.");
    y = para(doc, y, "4.2. Prestatorul nu va comunica Beneficiarului diagnostice, conținutul ședințelor, informații personale sau concluzii individuale despre angajați, cu excepția cazurilor în care există consimțământ scris din partea persoanei vizate sau obligație legală.");
    y = para(doc, y, "4.3. Beneficiarul înțelege că relația psihologică dintre Prestator și participant se bazează pe confidențialitate, autonomie și consimțământ informat.");

    y = section(doc, y, "5. Durata contractului");
    y = para(doc, y, `5.1. Contractul se încheie pe perioada colaborării dintre Părți, începând cu data de ${data.startDate}.`);
    y = para(doc, y, "5.2. Calendarul serviciilor se stabilește prin anexă, comandă, e-mail sau alt document agreat de Părți.");

    y = section(doc, y, "6. Prețul și modalitatea de plată");
    y = para(doc, y, `6.1. Prețul serviciilor este de ${sessionPrice}, conform ofertei sau anexei agreate.`);
    y = para(doc, y, "6.2. Prestatorul va emite factură fiscală pentru serviciile prestate.");
    y = para(doc, y, "6.3. Plata se face în termenul prevăzut în factura emisă sau în condițiile agreate între Părți.");
    y = para(doc, y, "6.4. În cazul întârzierii la plată, Prestatorul poate suspenda prestarea serviciilor până la achitarea sumelor restante.");

    y = section(doc, y, "7. Obligațiile Prestatorului");
    y = bulletList(doc, y, [
      "să presteze serviciile cu profesionalism și în limitele competenței sale;",
      "să respecte confidențialitatea participanților;",
      "să informeze participanții despre cadrul și limitele serviciilor;",
      "să transmită Beneficiarului doar informații administrative sau anonimizate;",
      "să respecte legislația privind protecția datelor personale.",
    ]);

    y = section(doc, y, "8. Obligațiile Beneficiarului");
    y = bulletList(doc, y, [
      "să furnizeze informațiile necesare organizării serviciilor;",
      "să nu solicite Prestatorului informații confidențiale despre participanți;",
      "să asigure un cadru logistic adecvat, dacă serviciile se desfășoară la sediul Beneficiarului;",
      "să informeze participanții despre caracterul serviciilor;",
      "să achite facturile la termen.",
    ]);

    y = section(doc, y, "9. Protecția datelor personale");
    y = para(doc, y, "9.1. Părțile vor respecta legislația aplicabilă privind protecția datelor cu caracter personal.");
    y = para(doc, y, "9.2. Datele participanților vor fi prelucrate exclusiv în scopul prestării serviciilor și al evidenței administrative.");
    y = para(doc, y, "9.3. Beneficiarul nu va solicita date sensibile despre participanți, cu excepția situațiilor expres prevăzute de lege.");

    y = section(doc, y, "10. Proprietate intelectuală");
    y = para(doc, y, "10.1. Materialele create de Prestator pentru workshopuri, traininguri sau intervenții aparțin Prestatorului, cu excepția cazului în care Părțile stabilesc altfel în scris.");
    y = para(doc, y, "10.2. Beneficiarul nu poate reproduce, distribui sau modifica materialele Prestatorului fără acord scris.");

    y = section(doc, y, "11. Încetarea contractului");
    y = bulletList(doc, y, [
      "prin acordul Părților;",
      "la expirarea perioadei contractuale;",
      "prin notificare unilaterală cu minimum 15 zile înainte;",
      "în cazul neplății serviciilor;",
      "în cazul încălcării confidențialității sau a cadrului profesional.",
    ]);

    y = section(doc, y, "12. Litigii");
    y = para(doc, y, "Orice litigiu va fi soluționat pe cale amiabilă. Dacă nu se ajunge la o soluție, competența revine instanțelor competente din România.");

    y = section(doc, y, "13. Dispoziții finale");
    y = para(doc, y, "13.1. Contractul intră în vigoare la data semnării.");
    y = para(doc, y, "13.2. Contractul se semnează în două exemplare originale.");
  }

  if (templateType === "CAS") {
    y = section(doc, y, "1. Furnizorul serviciilor");
    y = para(doc, y, `${therapistEntity}, CUI ${therapistCif}, cu sediul profesional în ${therapistAddress}, reprezentat prin ${therapistName}, în calitate de ${therapistRole}, telefon ${therapistPhone}, e-mail ${therapistEmail}.`);

    y = section(doc, y, "2. Datele pacientului / beneficiarului");
    y = para(doc, y, `Nume și prenume: ${safeValue(data.clientName)}.`);
    y = para(doc, y, `CNP: ${safeValue(data.clientCNP)}. Domiciliu: ${safeValue(data.clientAddress)}.`);
    y = para(doc, y, `Serviciu solicitat: servicii psihologice decontate / raportate CAS${data.casContractNumber ? `, în baza contractului CAS ${data.casContractNumber}` : ""}${data.casCounty ? `, județ ${data.casCounty}` : ""}.`);

    y = section(doc, y, "3. Informarea beneficiarului");
    y = para(doc, y, "3.1. Beneficiarul declară că a fost informat cu privire la natura serviciilor psihologice, scopul acestora, modul de desfășurare, limitele intervenției și drepturile sale.");
    y = para(doc, y, "3.2. Beneficiarul înțelege că serviciile psihologice pot presupune evaluare, consiliere, psihoterapie, monitorizare sau recomandări psihologice, în funcție de nevoia identificată și de competențele Prestatorului.");
    y = para(doc, y, "3.3. Beneficiarul înțelege că participarea la serviciile psihologice presupune colaborare activă și că nu se garantează un rezultat prestabilit.");

    y = section(doc, y, "4. Consimțământ pentru prestarea serviciilor");
    y = bulletList(doc, y, [
      "a înțeles natura serviciilor oferite;",
      "este de acord cu participarea la serviciile psihologice;",
      "a avut posibilitatea să adreseze întrebări;",
      "a primit explicații clare privind procesul;",
      "își exprimă consimțământul liber, informat și explicit.",
    ]);

    y = section(doc, y, "5. Consimțământ pentru prelucrarea datelor personale");
    y = para(doc, y, "5.1. Beneficiarul este informat că datele sale personale vor fi prelucrate în scopul prestării serviciilor psihologice, al evidenței documentelor și, dacă este cazul, al raportării către instituțiile competente sau sistemul de asigurări.");
    y = para(doc, y, "5.2. Datele prelucrate pot include: nume, prenume, CNP, adresă, date de contact, calitate de asigurat, informații medicale/psihologice relevante și alte date necesare prestării serviciilor.");
    y = para(doc, y, "5.3. Beneficiarul își exprimă acordul pentru prelucrarea datelor personale în aceste scopuri.");

    y = section(doc, y, "6. Confidențialitate");
    y = para(doc, y, "6.1. Informațiile comunicate în cadrul serviciilor psihologice sunt confidențiale.");
    y = para(doc, y, "6.2. Confidențialitatea poate fi limitată doar în cazurile prevăzute de lege, în situații de risc pentru viață, integritate sau siguranță, ori atunci când raportarea este impusă de cadrul contractual sau instituțional aplicabil.");
    y = para(doc, y, `6.3. În cazul serviciilor decontate sau raportate prin sistemul de asigurări, pot fi transmise doar datele necesare validării, evidenței și justificării serviciilor${data.referralNumber ? `, inclusiv în baza biletului nr. ${data.referralNumber}` : ""}${data.referralDate ? ` din ${data.referralDate}` : ""}${data.referringDoctor ? ` emis de ${data.referringDoctor}` : ""}.`);

    y = section(doc, y, "7. Drepturile beneficiarului");
    y = bulletList(doc, y, [
      "să fie informat cu privire la serviciile oferite;",
      "să refuze sau să întrerupă serviciile, cu respectarea condițiilor aplicabile;",
      "să solicite clarificări privind prelucrarea datelor personale;",
      "să beneficieze de confidențialitate;",
      "să solicite documente justificative, în condițiile legii.",
    ]);

    y = section(doc, y, "8. Declarația beneficiarului");
    y = para(doc, y, `Subsemnatul/a ${safeValue(data.clientName)}, declar că am citit, am înțeles și accept prevederile prezentului consimțământ informat.`);
    y = para(doc, y, "Declar că informațiile furnizate sunt reale și complete, iar acordul meu este exprimat liber și informat.");
  }

  if (templateType === "MINOR") {
    signatureBlockTriple(
      doc,
      y,
      "Prestator",
      "Reprezentant legal",
      "Beneficiar minor",
      "(semnătură)",
      "(semnătură / acord, dacă este cazul)",
    );
  } else {
    const rightLabel = templateType === "B2B"
      ? "Beneficiar"
      : templateType === "CAS"
        ? "Beneficiar / Pacient"
        : "Beneficiar";

    signatureBlock(
      doc,
      y,
      "Prestator",
      rightLabel,
      templateType === "B2B"
        ? "(semnătură și ștampilă, dacă este cazul)"
        : "(semnătură olografă digitală)",
    );
  }

  footer(doc);
  writeFooterMetadata(doc, data.templateVersion, data.statusLabel);
  if (isDraft) {
    drawDraftWatermark(doc);
  }
  pageHeaderRenderer = null;

  const fileNameBase = templateType === "B2B"
    ? `contract-b2b-${safeValue(data.companyName, "beneficiar")}`
    : templateType === "MINOR"
      ? `contract-minor-${safeValue(data.clientName, "minor")}`
      : templateType === "CAS"
        ? `consimtamant-cas-${safeValue(data.clientName, "pacient")}`
        : `contract-standard-${safeValue(data.clientName, "client")}`;

  return {
    blob: doc.output("blob"),
    fileName: normalizePdfFileName(fileNameBase),
  };
}

export async function generateGdprConsent(data: {
  contractNumber?: string;
  contractDate?: string;
  clientName: string;
  clientCNP: string;
  clientAddress?: string;
  therapistName: string;
  therapistEntity?: string;
  therapistCIF?: string;
  therapistAddress?: string;
  therapistPhone?: string;
  therapistEmail?: string;
  date: string;
}): Promise<GeneratedPdfResult> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  header(doc, "Anexă GDPR / Notă de Informare și Consimțământ");
  writeDocumentMeta(
    doc,
    "Anexă la contractul nr.",
    data.contractNumber || "________________",
    "Data:",
    data.contractDate || data.date,
  );

  let y = 66;

  y = section(doc, y, "1. Operatorul de date");
  y = para(doc, y, `${safeValue(data.therapistEntity, "Cabinet individual de psihologie / psihoterapie")}, CUI ${safeValue(data.therapistCIF, "—")}, sediu profesional ${safeValue(data.therapistAddress, "—")}, reprezentat prin ${safeValue(data.therapistName)}, telefon ${safeValue(data.therapistPhone, "—")}, e-mail ${safeValue(data.therapistEmail, "—")}. În continuare, operatorul va fi numit Cabinetul sau Operatorul.`);

  y = section(doc, y, "2. Persoana vizată");
  y = para(doc, y, `Client adult: ${safeValue(data.clientName)}, CNP ${safeValue(data.clientCNP)}, adresă ${safeValue(data.clientAddress, "—")}.`);

  y = section(doc, y, "3. Scopul documentului");
  y = para(doc, y, "Prezenta anexă explică modul în care Cabinetul colectează, folosește, stochează și protejează datele cu caracter personal ale persoanelor vizate. Documentul acoperă datele colectate înainte de prima ședință, datele completate în contracte, formulare și consimțăminte, datele discutate în timpul ședințelor, datele necesare pentru facturare, programări, prestarea serviciilor psihologice și îndeplinirea obligațiilor legale.");

  y = section(doc, y, "4. Categorii de date prelucrate");
  y = bulletList(doc, y, [
    "date de identificare: nume, prenume, CNP, serie și număr act de identitate, data nașterii, semnătura;",
    "date de contact: adresă, telefon, e-mail și datele reprezentanților legali, dacă este cazul;",
    "date contractuale și financiare: număr contract, servicii contractate, tarif, facturi, chitanțe;",
    "date privind sănătatea și viața psihologică: simptome, istoric relevant, notițe clinice, evaluări, recomandări terapeutice;",
    "date tehnice aferente serviciilor online, dacă este cazul.",
  ]);

  y = section(doc, y, "5. Scopurile prelucrării");
  y = bulletList(doc, y, [
    "prestarea serviciilor psihologice;",
    "încheierea și executarea contractului;",
    "facturare și evidență contabilă;",
    "obligații legale și profesionale;",
    "comunicări administrative, inclusiv programări și reprogramări.",
  ]);
  y = para(doc, y, "Cabinetul nu folosește datele pentru marketing fără consimțământ separat.");

  y = section(doc, y, "6. Temeiurile legale ale prelucrării");
  y = bulletList(doc, y, [
    "executarea contractului;",
    "respectarea obligațiilor legale;",
    "consimțământul pentru anumite prelucrări, în special pentru date privind sănătatea;",
    "interesul legitim pentru gestionarea programărilor, apărarea drepturilor și menținerea evidențelor profesionale;",
    "interese vitale în situații de risc major pentru viață, integritate sau siguranță.",
  ]);

  y = section(doc, y, "7. Confidențialitate și limite");
  y = para(doc, y, "Toate informațiile discutate în cadrul ședințelor sunt confidențiale. Confidențialitatea poate fi limitată în caz de risc de suicid sau auto-vătămare gravă, risc de vătămare a altor persoane, suspiciuni de abuz sau neglijare asupra unui minor, obligații legale de raportare, solicitări legale ale autorităților competente ori pentru apărarea drepturilor Cabinetului într-un litigiu sau reclamație.");

  y = section(doc, y, "8. Perioada de stocare și securitatea datelor");
  y = para(doc, y, "Datele sunt păstrate doar pe perioada necesară scopurilor pentru care au fost colectate, conform obligațiilor legale, fiscale și profesionale. Cabinetul aplică măsuri tehnice și organizatorice precum limitarea accesului, parole pentru dispozitive și conturi digitale, actualizarea sistemelor, folosirea canalelor de comunicare adecvate, anonimizarea datelor acolo unde este posibil și distrugerea documentelor care nu mai sunt necesare.");

  y = section(doc, y, "9. Drepturile persoanei vizate");
  y = bulletList(doc, y, [
    "dreptul de informare;",
    "dreptul de acces;",
    "dreptul la rectificare;",
    "dreptul la ștergere, în condițiile legii;",
    "dreptul la restricționare;",
    "dreptul la opoziție;",
    "dreptul la portabilitate;",
    "dreptul de retragere a consimțământului;",
    "dreptul de a depune plângere la autoritatea competentă.",
  ]);

  y = section(doc, y, "10. Declarație de consimțământ");
  y = para(doc, y, `Subsemnatul/a ${safeValue(data.clientName)}, declar că am citit prezenta notă de informare, am înțeles scopurile prelucrării datelor, categoriile de date prelucrate, drepturile mele și limitele confidențialității și îmi exprim consimțământul pentru prelucrarea datelor necesare prestării serviciilor psihologice.`);
  y = para(doc, y, "Îmi exprim consimțământul explicit pentru prelucrarea datelor privind sănătatea, viața psihologică și alte date sensibile necesare prestării serviciilor psihologice.");

  signatureBlock(doc, y, "Prestator", "Persoana vizată", "(semnătură)");
  footer(doc);
  pageHeaderRenderer = null;

  return {
    blob: doc.output("blob"),
    fileName: normalizePdfFileName(`anexa-gdpr-${safeValue(data.clientName, "client")}`),
  };
}
