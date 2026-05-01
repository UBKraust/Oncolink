import { Shield, Scale, Lock, Eye, FileText, Server, Mail } from "lucide-react";
import { PublicDocumentShell } from "@/components/app/page-shell";

export default function PrivacyPage() {
  return (
    <PublicDocumentShell
      backHref="/dashboard"
      backLabel="Înapoi la dashboard"
      icon={Shield}
      title="Anexă GDPR / Politica de Confidențialitate"
      subtitle="Ultima actualizare: 25 Aprilie 2026"
      accentClassName="bg-slate-950 text-white"
    >
          <div className="prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Lock className="h-5 w-5 text-primary" /> 1. Operatorul și scopul documentului
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Această pagină rezumă modul în care Cabinetul colectează, folosește, stochează și protejează datele cu caracter personal în contextul serviciilor psihologice, al documentelor contractuale și al utilizării generatorului de documente din platformă.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Documentul acoperă datele completate înainte de prima ședință, datele incluse în contracte, formulare și consimțăminte, informațiile discutate în timpul ședințelor, datele necesare pentru facturare, programări, obligații legale și, dacă este cazul, servicii decontate.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Eye className="h-5 w-5 text-primary" /> 2. Ce date pot fi prelucrate
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Date de identificare: nume, prenume, CNP, serie și număr act de identitate, data nașterii, semnătura.</li>
                <li>Date de contact: adresă, telefon, e-mail și datele reprezentanților legali, dacă este cazul.</li>
                <li>Date contractuale și financiare: număr contract, servicii contractate, tarif, facturi, chitanțe și date bancare unde este necesar.</li>
                <li>Date privind sănătatea și viața psihologică: simptome, istoric relevant, evaluări, note clinice, recomandări, chestionare și fișe de lucru.</li>
                <li>Date tehnice aferente serviciilor online: e-mail, linkuri de conectare, metadate tehnice și data/ora conectării.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <FileText className="h-5 w-5 text-primary" /> 3. Scopurile și temeiurile prelucrării
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Datele sunt prelucrate pentru prestarea serviciilor psihologice, încheierea și executarea contractului, programări și comunicări administrative, facturare și evidență contabilă, respectarea obligațiilor legale și profesionale, respectiv validare și raportare pentru servicii CAS sau decontate, dacă este cazul.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Temeiurile pot include executarea contractului, obligații legale, consimțământul pentru anumite prelucrări, interesul legitim pentru gestionarea relației contractuale și interese vitale în situații de risc major.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Shield className="h-5 w-5 text-primary" /> 4. Confidențialitate profesională
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Informațiile discutate în cadrul ședințelor sunt confidențiale. Cabinetul nu comunică altor persoane conținutul ședințelor fără acord scris, cu excepția situațiilor prevăzute de lege sau în caz de risc semnificativ pentru viață, integritate sau siguranță.
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-muted/20 p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">Confidențialitatea poate fi limitată în caz de:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>risc de suicid sau auto-vătămare gravă;</li>
                  <li>risc de vătămare a altor persoane;</li>
                  <li>suspiciuni de abuz, neglijare sau violență asupra unui minor;</li>
                  <li>obligații legale de raportare sau solicitări legitime ale autorităților;</li>
                  <li>apărarea drepturilor Cabinetului într-un litigiu sau reclamație.</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Scale className="h-5 w-5 text-primary" /> 5. Drepturile persoanei vizate
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Dreptul de informare și acces la datele proprii.</li>
                <li>Dreptul la rectificarea datelor inexacte sau incomplete.</li>
                <li>Dreptul la ștergere, în condițiile legii și cu limitele impuse de obligațiile profesionale sau legale.</li>
                <li>Dreptul la restricționare, opoziție și portabilitate, acolo unde se aplică.</li>
                <li>Dreptul de retragere a consimțământului pentru prelucrările bazate pe consimțământ.</li>
                <li>Dreptul de a depune plângere la autoritatea competentă.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Server className="h-5 w-5 text-primary" /> 6. Stocare, securitate și destinatari
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Datele sunt păstrate doar pe perioada necesară scopurilor pentru care au fost colectate și conform obligațiilor legale, fiscale și profesionale. Cabinetul aplică măsuri tehnice și organizatorice precum controlul accesului, parole, actualizarea sistemelor, folosirea canalelor adecvate de comunicare, pseudonimizare sau anonimizare acolo unde este posibil și distrugerea documentelor care nu mai sunt necesare.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Datele pot fi comunicate, strict în măsura necesară, către autorități publice competente, organe fiscale, contabil, avocat, furnizori IT, platforme de programare ori videoconferință, servicii de e-mail, instituții implicate în decontare și alte organisme profesionale, în condițiile legii.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
                <Mail className="h-5 w-5 text-primary" /> 7. Comunicări digitale și servicii online
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                E-mailul, telefonul, SMS-ul, WhatsApp-ul sau alte aplicații pot fi folosite pentru comunicări administrative, programări, reprogramări sau transmiterea documentelor. Beneficiarul este rugat să evite trimiterea datelor sensibile prin canale nesecurizate, iar Cabinetul va evita transmiterea de informații clinice sensibile prin astfel de canale dacă nu este strict necesar.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Pentru ședințele online, beneficiarul este responsabil să asigure un spațiu privat, liniștit și sigur. Ședințele nu se înregistrează audio sau video în mod implicit și orice înregistrare necesită acord expres.
              </p>
            </section>

            <div className="mt-12 border-t border-border/60 pt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Pentru exercitarea drepturilor privind datele personale sau pentru întrebări legate de confidențialitate, folosește datele de contact ale Cabinetului comunicate în contractele și documentele generate în aplicație.
              </p>
            </div>
          </div>
    </PublicDocumentShell>
  );
}
