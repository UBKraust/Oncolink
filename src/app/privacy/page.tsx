import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Scale, Lock, Eye, FileText, Server, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="ghost" className="gap-2 text-slate-500 hover:text-primary">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Înapoi la Dashboard
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <Shield className="h-12 w-12 text-primary mb-4 relative z-10" />
            <h1 className="text-3xl font-black relative z-10">Anexă GDPR / Politica de Confidențialitate</h1>
            <p className="text-slate-400 mt-2 relative z-10">Ultima actualizare: 25 Aprilie 2026</p>
          </div>

          <div className="p-10 prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" /> 1. Operatorul și scopul documentului
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Această pagină rezumă modul în care Cabinetul colectează, folosește, stochează și protejează datele cu caracter personal în contextul serviciilor psihologice, al documentelor contractuale și al utilizării generatorului de documente din platformă.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Documentul acoperă datele completate înainte de prima ședință, datele incluse în contracte, formulare și consimțăminte, informațiile discutate în timpul ședințelor, datele necesare pentru facturare, programări, obligații legale și, dacă este cazul, servicii decontate.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" /> 2. Ce date pot fi prelucrate
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Date de identificare: nume, prenume, CNP, serie și număr act de identitate, data nașterii, semnătura.</li>
                <li>Date de contact: adresă, telefon, e-mail și datele reprezentanților legali, dacă este cazul.</li>
                <li>Date contractuale și financiare: număr contract, servicii contractate, tarif, facturi, chitanțe și date bancare unde este necesar.</li>
                <li>Date privind sănătatea și viața psihologică: simptome, istoric relevant, evaluări, note clinice, recomandări, chestionare și fișe de lucru.</li>
                <li>Date tehnice aferente serviciilor online: e-mail, linkuri de conectare, metadate tehnice și data/ora conectării.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" /> 3. Scopurile și temeiurile prelucrării
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Datele sunt prelucrate pentru prestarea serviciilor psihologice, încheierea și executarea contractului, programări și comunicări administrative, facturare și evidență contabilă, respectarea obligațiilor legale și profesionale, respectiv validare și raportare pentru servicii CAS sau decontate, dacă este cazul.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Temeiurile pot include executarea contractului, obligații legale, consimțământul pentru anumite prelucrări, interesul legitim pentru gestionarea relației contractuale și interese vitale în situații de risc major.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" /> 4. Confidențialitate profesională
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Informațiile discutate în cadrul ședințelor sunt confidențiale. Cabinetul nu comunică altor persoane conținutul ședințelor fără acord scris, cu excepția situațiilor prevăzute de lege sau în caz de risc semnificativ pentru viață, integritate sau siguranță.
              </p>
              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 mt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Confidențialitatea poate fi limitată în caz de:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  <li>risc de suicid sau auto-vătămare gravă;</li>
                  <li>risc de vătămare a altor persoane;</li>
                  <li>suspiciuni de abuz, neglijare sau violență asupra unui minor;</li>
                  <li>obligații legale de raportare sau solicitări legitime ale autorităților;</li>
                  <li>apărarea drepturilor Cabinetului într-un litigiu sau reclamație.</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-primary" /> 5. Drepturile persoanei vizate
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Dreptul de informare și acces la datele proprii.</li>
                <li>Dreptul la rectificarea datelor inexacte sau incomplete.</li>
                <li>Dreptul la ștergere, în condițiile legii și cu limitele impuse de obligațiile profesionale sau legale.</li>
                <li>Dreptul la restricționare, opoziție și portabilitate, acolo unde se aplică.</li>
                <li>Dreptul de retragere a consimțământului pentru prelucrările bazate pe consimțământ.</li>
                <li>Dreptul de a depune plângere la autoritatea competentă.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-primary" /> 6. Stocare, securitate și destinatari
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Datele sunt păstrate doar pe perioada necesară scopurilor pentru care au fost colectate și conform obligațiilor legale, fiscale și profesionale. Cabinetul aplică măsuri tehnice și organizatorice precum controlul accesului, parole, actualizarea sistemelor, folosirea canalelor adecvate de comunicare, pseudonimizare sau anonimizare acolo unde este posibil și distrugerea documentelor care nu mai sunt necesare.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Datele pot fi comunicate, strict în măsura necesară, către autorități publice competente, organe fiscale, contabil, avocat, furnizori IT, platforme de programare ori videoconferință, servicii de e-mail, instituții implicate în decontare și alte organisme profesionale, în condițiile legii.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" /> 7. Comunicări digitale și servicii online
              </h2>
              <p className="text-slate-600 leading-relaxed">
                E-mailul, telefonul, SMS-ul, WhatsApp-ul sau alte aplicații pot fi folosite pentru comunicări administrative, programări, reprogramări sau transmiterea documentelor. Beneficiarul este rugat să evite trimiterea datelor sensibile prin canale nesecurizate, iar Cabinetul va evita transmiterea de informații clinice sensibile prin astfel de canale dacă nu este strict necesar.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Pentru ședințele online, beneficiarul este responsabil să asigure un spațiu privat, liniștit și sigur. Ședințele nu se înregistrează audio sau video în mod implicit și orice înregistrare necesită acord expres.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm">
                Pentru exercitarea drepturilor privind datele personale sau pentru întrebări legate de confidențialitate, folosește datele de contact ale Cabinetului comunicate în contractele și documentele generate în aplicație.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
