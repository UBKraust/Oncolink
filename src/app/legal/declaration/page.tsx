"use client";

import { ShieldCheck, Printer, Scale, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicDocumentShell } from "@/components/app/page-shell";



export default function DeclarationPage() {
  return (
    <PublicDocumentShell
      backHref="/dashboard"
      backLabel="Inapoi la dashboard"
      icon={ShieldCheck}
      title="Declarație pe proprie răspundere"
      subtitle="Document legal · validare date minor"
      accentClassName="bg-rose-900 text-white print:bg-white print:text-black print:border-b print:border-slate-200"
    >
          <div className="prose prose-slate max-w-none print:max-w-none">
            <div className="flex items-center gap-3 mb-8 p-6 bg-rose-50 rounded-2xl border border-rose-100 print:bg-slate-50 print:border-slate-200">
              <Scale className="h-6 w-6 text-rose-600 shrink-0" />
              <p className="text-sm font-bold text-rose-900 m-0 print:text-slate-900">
                Atenție: Acest document are valoare juridică conform legislației române în vigoare.
              </p>
            </div>

            <div className="space-y-8 py-4">
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-rose-600 rounded-full opacity-20 print:hidden" />
                <p className="text-xl leading-relaxed text-slate-800 font-medium italic">
                  &ldquo;Prin prezenta declar că datele furnizate cu privire la identitatea minorului și regimul său juridic sunt conforme cu realitatea. Înțeleg că furnizarea de informații false despre custodia copilului poate atrage răspunderea civilă sau penală conform Codului Civil Român.&rdquo;
                </p>
              </div>

              <section className="mt-12 space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-rose-600" /> Context Juridic
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Această declarație este necesară pentru a asigura conformitatea actului terapeutic cu reglementările privind protecția copilului și exercitarea autorității părintești. În cazul părinților divorțați, această declarație confirmă existența acordului ambilor părinți sau a unei sentințe judecătorești definitive care permite desfășurarea terapiei.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-12 border-t border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-12">
              <div className="space-y-8 w-full sm:w-1/2">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Semnătura Părinte / Tutore</p>
                  <div className="h-px bg-slate-200 w-full" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Data Semnării</p>
                  <div className="h-px bg-slate-200 w-full" />
                </div>
              </div>
              
              <div className="text-right print:hidden">
                <Button onClick={() => window.print()} className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl px-6 py-6 font-bold shadow-xl shadow-slate-200">
                  <Printer className="h-4 w-4" /> Printează Documentul
                </Button>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Generat automat de platforma Ce`ai Pățit? · © 2026
              </p>
            </div>
          </div>
    </PublicDocumentShell>
  );
}
