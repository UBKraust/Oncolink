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
      `Pagina ${i} din ${pages}  ·  Generat de Ce\`ai Pățit?  ·  ${new Date().toLocaleDateString("ro-RO")}`,
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

function safeValue(value?: string | null): string {
  return value?.trim() || "________________";
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
  therapistPracticeName?: string;
  therapistPracticeAddress?: string;
  therapistPracticePhone?: string;
  therapistPracticeEmail?: string;
  therapistPracticeCaen?: string;
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
  casContractNumber?: string;
  casCounty?: string;
}

export interface GeneratedPdfResult {
  blob: Blob;
  fileName: string;
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

export async function generateContract(data: ContractData): Promise<GeneratedPdfResult> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let title = "Contract de Prestări Servicii Psihologice";
  if (data.isB2B) title = "Contract de servicii de asistență/consultanță psihologică";
  if (data.isCas) title = "Consimțământ Informat - Servicii Decontate CAS";

  header(doc, title);
  doc.setFontSize(9);
  doc.text(`Nr. ${data.contractNumber} / Data: ${data.startDate}`, PAGE_W - MARGIN - 50, 25);

  let y = 44;
  const sessionPriceLabel = `${data.sessionPrice.toFixed(2)} RON / sedinta`;
  const therapistPracticeName = safeValue(data.therapistPracticeName);
  const therapistPracticeAddress = safeValue(data.therapistPracticeAddress);
  const therapistPracticePhone = safeValue(data.therapistPracticePhone);
  const therapistPracticeEmail = safeValue(data.therapistPracticeEmail);
  const therapistPracticeCaen = safeValue(data.therapistPracticeCaen);
  const beneficiaryIdentity = data.isB2B
    ? safeValue(data.companyName)
    : safeValue(data.clientName);
  const beneficiaryAddress = safeValue(data.clientAddress);
  const beneficiaryIdentifier = safeValue(data.isB2B ? data.companyCIF : data.clientCNP);
  const beneficiaryRepresentative = data.isB2B
    ? `${safeValue(data.representativeName)}${data.representativeRole ? `, ${data.representativeRole}` : ""}`
    : data.isMinor
      ? [data.parent1Name, data.parent2Name].filter(Boolean).join(" / ") || "________________"
      : "Nu este cazul";

  // 1. Părți Contractante
  y = section(doc, y, "Părțile contractante");
  y = para(
    doc,
    y,
    `Prestator - ${data.therapistName || "________________"}, psiholog clinician si psihoterapeut, PFA cu denumirea "${therapistPracticeName}", avand CUI ${data.therapistCIF || "________________"}, cu sediul profesional in ${therapistPracticeAddress}, telefon ${therapistPracticePhone}, e-mail ${therapistPracticeEmail}${data.therapistIBAN ? `, cont bancar ${data.therapistIBAN}` : ""}, cod CAEN ${therapistPracticeCaen}.`
  );
  y = para(
    doc,
    y,
    data.isB2B
      ? `Beneficiar - ${beneficiaryIdentity}, cu sediul social in ${beneficiaryAddress}, CUI/CIF ${beneficiaryIdentifier}, Reg. Com. ${safeValue(data.companyRegCom)}, reprezentat legal de ${beneficiaryRepresentative}, denumit in continuare "Beneficiarul".`
      : `Beneficiar - ${beneficiaryIdentity}, cu domiciliul in ${beneficiaryAddress}, CNP ${beneficiaryIdentifier}${data.isMinor ? `, reprezentat legal de ${beneficiaryRepresentative}` : ""}, denumit in continuare "Beneficiarul".`
  );

  // 2. Obiectul Contractului
  y += 4;
  y = section(doc, y, "Obiectul contractului");
  if (data.isCas) {
    y = para(doc, y, `Prezentul acord reglementează prestarea serviciilor psihologice decontate prin Casa de Asigurări de Sănătate în baza biletului de trimitere nr. ${data.referralNumber || "—"} din data de ${data.referralDate || "—"} emis de Dr. ${data.referringDoctor || "—"}.`);
    if (data.casContractNumber || data.casCounty) {
      y = para(doc, y, `Serviciile sunt furnizate în baza contractului CAS ${data.casContractNumber || "—"}${data.casCounty ? `, județ ${data.casCounty}` : ""}.`);
    }
    y = para(doc, y, "Beneficiarul declară că a fost informat cu privire la drepturile și obligațiile ce decurg din calitatea de asigurat.");
  } else {
    y = para(doc, y, "2.1. Obiectul prezentului contract il constituie furnizarea de servicii psihologice si/sau psihoterapeutice de catre Prestator in beneficiul Beneficiarului sau al persoanelor nominalizate de acesta, dupa caz.");
    y = para(doc, y, "Serviciile pot include: sesiuni de consiliere psihologica individuala sau de grup cu adolescenti/adulti; evaluari psihologice si elaborarea unor planuri de interventie; workshopuri privind autoreglarea emotionala, comunicarea in familie si tehnici cognitiv-comportamentale; alte servicii conexe agreate de parti, in limitele specializarii Prestatorului.");
    y = para(doc, y, "2.2. Prestatorul va oferi serviciile conform competentelor sale profesionale, legilor aplicabile si normelor etice ale Colegiului Psihologilor din Romania.");
  }

  if (!data.isCas) {
    y = section(doc, y, "Durata contractului");
    y = para(doc, y, "3.1. Contractul se incheie pe durata determinata, incepand cu data semnarii, pana la incetarea colaborarii prin acordul partilor sau conform clauzelor de mai jos. Partile pot conveni prelungirea sau detalierea relatiei contractuale prin act aditional.");
    y = para(doc, y, "3.2. Daca Beneficiarul solicita suspendarea temporara a serviciilor, Prestatorul va fi notificat cu cel putin 5 zile lucratoare inainte.");

    y = section(doc, y, "Programarea sedintelor");
    y = para(doc, y, "4.1. Sedintele de terapie se vor desfasura in spatiul profesional din Bucuresti sau online, dupa caz. Beneficiarul si Prestatorul stabilesc de comun acord frecventa sedintelor.");
    y = para(doc, y, "4.2. Programarile se fac prin telefon sau e-mail, cu cel putin 48 de ore inainte. Anularile sau reprogramarile se notifica cu minimum 24 de ore inainte; in caz contrar, sedinta se considera rezervata si poate fi facturata integral.");

    y = section(doc, y, "Pretul si modalitatea de plata");
    y = para(doc, y, `5.1. Tariful pentru o sedinta de consiliere/psihoterapie de aproximativ 50 de minute este de ${sessionPriceLabel}. Pentru workshopuri, evaluari sau servicii complexe se poate stabili un tarif separat.`);
    y = para(doc, y, `5.2. Beneficiarul va achita contravaloarea serviciilor la fiecare sedinta, prin numerar sau transfer bancar${data.therapistIBAN ? ` in contul ${data.therapistIBAN}` : ""}.`);
    if (data.isB2B) {
      y = para(doc, y, "5.3. Pentru persoane juridice, Prestatorul va emite factura fiscala conform legislatiei; plata se face in termen de 15 zile calendaristice de la data facturii.");
    } else {
      y = para(doc, y, "5.3. Prestatorul poate emite factura sau chitanta, conform legislatiei aplicabile. Cabinetul nu este inregistrat in scopuri de TVA.");
    }

    y = section(doc, y, "Drepturile si obligatiile partilor");
    y = para(doc, y, "6.1. Obligatiile Prestatorului: sa respecte confidentialitatea datelor personale si sa le prelucreze exclusiv in scopul prestarii serviciilor psihologice; sa ofere servicii de calitate, in concordanta cu pregatirea sa si standardele profesionale; sa informeze Beneficiarul despre obiectivele, metodele si durata programului terapeutic si sa obtina consimtamantul informat; sa mentina un climat sigur si respectuos in timpul sedintelor.");
    y = para(doc, y, "6.2. Drepturile Prestatorului: sa primeasca remuneratia convenita la termenele stabilite; sa refuze prestarea serviciilor daca Beneficiarul nu respecta obligatiile contractuale sau daca apar situatii care ar compromite etica profesionala; sa solicite reprogramarea sedintelor atunci cand apar situatii de forta majora.");
    y = para(doc, y, "6.3. Obligatiile Beneficiarului: sa furnizeze informatii corecte privind starea psihologica si sa respecte recomandarile Prestatorului; sa respecte programarile si conditiile de anulare; sa achite contravaloarea serviciilor la termenele stabilite; sa nu divulge informatii confidentiale despre alte persoane care participa la sedinte de grup.");
    y = para(doc, y, "6.4. Drepturile Beneficiarului: sa primeasca servicii psihologice de calitate si sa fie informat despre metodele utilizate; sa intrerupa colaborarea in orice moment, cu notificare scrisa transmisa cu 5 zile inainte; sa primeasca factura fiscala si documente justificative la plata serviciilor.");
  }

  if (data.isMinor) {
    y = section(doc, y, "Clauze speciale pentru minor");
    y = para(doc, y, "Pentru beneficiarii minori, reprezentantii legali declara ca detin autoritatea parinteasca si isi exprima acordul pentru prestarea serviciilor psihologice, conform Legii 272/2004.");
    if (data.parent1Name) y = para(doc, y, `Reprezentant legal principal: ${data.parent1Name}.`);
    if (data.parent2Name) y = para(doc, y, `Al doilea reprezentant legal declarat: ${data.parent2Name}.`);
    if (data.parentsMaritalStatus) y = para(doc, y, `Situatia juridica declarata a parintilor: ${data.parentsMaritalStatus}.`);
    if (data.parentsMaritalStatus !== "CASATORITI" && data.courtSentenceNumber) {
      y = para(doc, y, `Conform sentintei judecatoresti nr. ${data.courtSentenceNumber}, custodia este exercitata potrivit dispozitiilor legale aplicabile.`);
    }
  }

  y = section(doc, y, "Confidentialitate si protectia datelor");
  y = para(doc, y, "7.1. Partile se obliga sa respecte prevederile GDPR si ale Legii nr. 213/2004 privind exercitarea profesiei de psiholog cu drept de libera practica. Informatiile si datele personale dezvaluite pe durata contractului sunt strict confidentiale.");
  y = para(doc, y, "7.2. Prestatorul poate utiliza date anonimizate in scopuri de cercetare sau formare profesionala numai cu consimtamantul scris al Beneficiarului.");

  if (!data.isCas) {
    y = section(doc, y, "Raspunderea contractuala");
    y = para(doc, y, "8.1. In cazul neexecutarii sau executarii necorespunzatoare a obligatiilor contractuale, partea in culpa raspunde pentru prejudiciile cauzate celeilalte parti, in conditiile legii.");
    y = para(doc, y, "8.2. Forta majora exonereaza partile de raspundere. Partea care invoca forta majora va notifica cealalta parte in termen de 5 zile de la aparitia evenimentului.");

    y = section(doc, y, "Incetarea contractului");
    y = para(doc, y, "9.1. Contractul inceteaza prin expirarea termenului convenit, prin acordul partilor sau prin denuntare unilaterala, cu notificarea prealabila de 5 zile.");
    y = para(doc, y, "9.2. Prestatorul poate rezilia contractul imediat in cazul in care Beneficiarul incalca grav obligatiile contractuale, inclusiv prin neplata repetata sau comportament agresiv.");

    y = section(doc, y, "Dispozitii finale");
    y = para(doc, y, "10.1. Orice modificare a prezentului contract se face prin act aditional semnat de ambele parti.");
    y = para(doc, y, "10.2. Litigiile nascute din interpretarea sau executarea contractului vor fi solutionate pe cale amiabila; in caz contrar, competenta revine instantelor judecatoresti din Bucuresti.");
    y = para(doc, y, `10.3. Contractul se semneaza astazi, ${data.startDate}, in doua exemplare originale, cate unul pentru fiecare parte.`);
  }

  // Signatures
  const leftLabel = "Prestator (Terapeut)";
  const rightLabel = data.isB2B ? "Beneficiar (Firmă)" : (data.isMinor ? "Reprezentanți Legali" : "Beneficiar (Pacient)");
  
  signatureBlock(doc, y, leftLabel, rightLabel);

  footer(doc);
  const fileName = data.isB2B ? `contract-b2b-${data.companyName}` : `contract-${data.clientName}`;
  const normalizedFileName = `${fileName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  const blob = doc.output("blob");

  return {
    blob,
    fileName: normalizedFileName,
  };
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
