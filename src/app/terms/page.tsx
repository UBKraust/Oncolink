import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Gavel, FileCheck, AlertTriangle, HelpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
            <p className="text-white/70 mt-2 relative z-10">Acord de utilizare platformă Ce`ai Pățit?</p>
          </div>

          <div className="p-10 prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-primary" /> 1. Acceptarea Termenilor
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizarea aplicației <strong>Ce`ai Pățit?</strong> implică acceptarea integrală a prezentelor condiții. Această platformă este destinată exclusiv profesioniștilor din domeniul sănătății mintale pentru managementul cabinetului individual.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-primary" /> 2. Responsabilitatea Utilizatorului
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizatorul (psihologul/terapeutul) este direct responsabil pentru:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600 font-medium">
                <li>Legalitatea colectării datelor pacienților.</li>
                <li>Păstrarea confidențialității acreditărilor de acces.</li>
                <li>Verificarea identității pacienților și a reprezentanților legali (în cazul minorilor).</li>
                <li>Configurarea corectă a setărilor de securitate și facturare.</li>
              </ul>
            </section>

            <section className="mb-10">
               <div className="p-6 rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex gap-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                     <h3 className="font-black text-amber-800 text-sm uppercase tracking-tight mb-1">Avertisment Legal Special</h3>
                     <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        Ce`ai Pățit? nu este un serviciu de urgență. În caz de risc iminent...
                     </p>
                  </div>
               </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" /> 3. Confidențialitatea Terapeutică
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Toate notele de ședință și planurile de tratament sunt protejate prin secret profesional. Platforma utilizează mecanisme de criptare pentru a asigura că aceste date nu pot fi accesate de terți neautorizați, inclusiv de către administratorii platformei (acolo unde este activat Seiful Digital).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" /> 4. Suport și Disponibilitate
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Platforma este în curs de dezvoltare și poate include mentenanță, actualizări sau limitări temporare. Utilizatorul este responsabil să evalueze dacă nivelul actual al serviciului este adecvat pentru utilizarea în cabinetul propriu.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm">
                Versiunea 1.2. Editarea acestor termeni poate fi făcută periodic. <br/>
                Continuarea utilizării serviciului constituie acordul dumneavoastră.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
