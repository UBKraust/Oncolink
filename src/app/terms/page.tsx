import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Gavel, FileCheck, AlertTriangle, HelpCircle, Lock, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <div className="bg-primary p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <Gavel className="h-12 w-12 text-white mb-4 relative z-10" />
            <h1 className="text-3xl font-black relative z-10">Termeni și Condiții</h1>
            <p className="text-white/70 mt-2 relative z-10">Pentru utilizarea generatorului de contracte și documente</p>
          </div>

          <div className="p-10 prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-primary" /> 1. Informații generale
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Generatorul este o aplicație digitală folosită pentru completarea, generarea, descărcarea, semnarea și arhivarea documentelor necesare desfășurării serviciilor psihologice sau psihoterapeutice. Prin accesarea sau utilizarea lui, utilizatorul confirmă că a citit, a înțeles și acceptă acești termeni.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Generatorul are scop administrativ și contractual. El nu înlocuiește actul terapeutic, evaluarea psihologică, consilierea sau psihoterapia propriu-zisă.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-primary" /> 2. Cine poate utiliza Generatorul
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>reprezentanții Cabinetului;</li>
                <li>clienți adulți;</li>
                <li>părinți, tutori sau reprezentanți legali;</li>
                <li>reprezentanți ai firmelor beneficiare;</li>
                <li>pacienți pentru documente CAS sau servicii decontate;</li>
                <li>personal administrativ autorizat.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Minorii nu pot semna singuri documente contractuale, cu excepția situațiilor permise de lege și doar în condițiile aplicabile.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Download className="h-5 w-5 text-primary" /> 3. Tipuri de documente generate
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Contract Standard Individual.</li>
                <li>Contract pentru Minor.</li>
                <li>Contract Business / B2B.</li>
                <li>Consimțământ CAS / servicii decontate.</li>
                <li>Anexă GDPR.</li>
                <li>Alte documente administrative pe care Cabinetul le poate adăuga ulterior.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" /> 4. Utilizarea corectă și securitatea accesului
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizatorul trebuie să completeze date reale, corecte și actualizate și este responsabil pentru verificarea informațiilor înainte de generarea documentului. Dacă aplicația presupune autentificare, utilizatorul este responsabil pentru păstrarea confidențialității datelor de acces și nu are dreptul să le ofere altor persoane neautorizate.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Orice suspiciune de acces neautorizat trebuie comunicată imediat Cabinetului. Cabinetul poate suspenda accesul dacă există suspiciuni de folosire abuzivă, frauduloasă sau neautorizată.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" /> 5. Reguli speciale pe tipuri de documente
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Pentru documentele minorului, reprezentantul legal declară că are dreptul de a solicita serviciile și de a semna documentele, precum și obligația de a comunica orice conflict parental, hotărâre judecătorească ori restricție relevantă. Cabinetul poate refuza prestarea serviciilor până la clarificarea situației juridice.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Pentru documentele B2B, reprezentantul firmei declară că are mandatul necesar. Firma nu are dreptul să solicite conținutul ședințelor individuale, diagnostice sau date sensibile ale participanților, iar Cabinetul poate transmite doar date administrative ori rapoarte anonimizate și agregate, dacă acest lucru este prevăzut contractual.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Pentru documentele CAS sau servicii decontate, utilizatorul trebuie să completeze date reale și necesare validării serviciilor. Generarea documentului nu garantează automat decontarea.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-primary" /> 6. Generarea, descărcarea și semnarea documentelor
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Documentele generate pot fi descărcate în PDF sau în alt format disponibil în aplicație. Acestea pot fi semnate fizic, electronic sau digital, în funcție de funcționalitățile disponibile și de acordul părților.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Prin semnarea documentului, utilizatorul confirmă că a citit documentul, a înțeles conținutul, că datele completate sunt corecte și că își exprimă acordul liber și informat. Cabinetul poate refuza un document semnat incomplet, ilizibil sau cu date contradictorii.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" /> 7. Date personale și confidențialitate
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizarea Generatorului implică prelucrarea unor date personale, inclusiv date sensibile privind sănătatea psihologică. Pentru detalii complete privind prelucrarea datelor, utilizatorul trebuie să consulte Anexa GDPR / Nota de informare privind prelucrarea datelor personale.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Documentele generate pot conține informații confidențiale, iar utilizatorul are obligația să nu le transmită către persoane neautorizate. În cazul contractelor B2B, angajatorul nu primește acces la conținutul ședințelor individuale.
              </p>
            </section>

            <section className="mb-10">
              <div className="p-6 rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-black text-amber-800 text-sm uppercase tracking-tight mb-1">Limitarea răspunderii</h3>
                  <p className="text-sm text-amber-700 leading-relaxed font-medium">
                    Generatorul este un instrument administrativ și nu reprezintă consultanță juridică independentă. Utilizatorul trebuie să verifice documentul înainte de semnare, iar pentru situații complexe se recomandă consultarea unui avocat.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Gavel className="h-5 w-5 text-primary" /> 8. Proprietate intelectuală și utilizări interzise
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Textele, structura, modelele de documente, interfața și elementele aplicației aparțin Cabinetului sau furnizorilor săi, după caz. Utilizatorul nu are dreptul să copieze, revândă, distribuie, modifice sau folosească modelele în afara scopului pentru care i-au fost puse la dispoziție.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>introducerea de date false;</li>
                <li>generarea de documente în numele altor persoane fără drept;</li>
                <li>falsificarea semnăturilor;</li>
                <li>accesarea neautorizată a datelor altor persoane;</li>
                <li>copierea sau distribuirea abuzivă a template-urilor;</li>
                <li>încercarea de compromitere a aplicației sau încărcarea de fișiere malițioase;</li>
                <li>folosirea documentelor pentru fraudă, presiune, șantaj sau discriminare.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" /> 9. Disponibilitate, actualizări și lege aplicabilă
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Pot exista întreruperi cauzate de mentenanță, actualizări, erori tehnice sau situații independente de Cabinet. În astfel de cazuri, documentele pot fi generate manual sau prin altă metodă agreată de părți.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Cabinetul poate modifica modelele de documente, Termenii și Condițiile, Anexa GDPR sau alte formulare. Modificările se aplică de la data publicării sau comunicării lor. Prezentul document este guvernat de legea română, iar orice neînțelegere va fi soluționată pe cale amiabilă, iar în caz contrar de instanțele competente din România.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm">
                Folosirea Generatorului constituie confirmarea că utilizatorul a citit acești termeni, a înțeles rolul aplicației și acceptă obligațiile care îi revin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
