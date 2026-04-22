import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Scale, Lock, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
          <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <Shield className="h-12 w-12 text-primary mb-4 relative z-10" />
            <h1 className="text-3xl font-black relative z-10">Politica de Confidențialitate</h1>
            <p className="text-slate-400 mt-2 relative z-10">Ultima actualizare: 21 Aprilie 2026</p>
          </div>

          <div className="p-10 prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" /> 1. Introducere
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Prezenta Politică de Confidențialitate descrie modul în care platforma <strong>Ce`ai Pățit?</strong> (gestionată de Cabinet Individual de Psihologie) colectează, utilizează și protejează datele cu caracter personal ale pacienților, în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația română în vigoare.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" /> 2. Datele Colectate
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Colectăm date strict necesare pentru desfășurarea actului terapeutic și obligațiile legale (facturare):
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                <li>Nume și prenume, CNP (pentru facturare și dosar clinic).</li>
                <li>Informații de contact (telefon, email).</li>
                <li>Date medicale și clinice (note de ședință, istoricul terapeutic).</li>
                <li>Informații despre reprezentanții legali (în cazul minorilor).</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" /> 3. Securitatea Datelor
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Siguranța datelor tale este prioritatea noastră absolută. Ce`ai Pățit? utilizează:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-sm text-slate-600">
                  "Criptare end-to-end pentru notele clinice."
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-sm text-slate-600">
                  "Stocare securizată pe servere certificate UE."
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-primary" /> 4. Drepturile Tale (GDPR)
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Conform GDPR, beneficiezi de:
              </p>
              <ul className="list-decimal pl-5 mt-2 space-y-2 text-slate-600 font-medium">
                <li><strong>Dreptul de acces:</strong> Poți solicita o copie a datelor tale.</li>
                <li><strong>Dreptul la rectificare:</strong> Poți cere corectarea datelor eronate.</li>
                <li><strong>Dreptul la ștergere (Dreptul de a fi uitat):</strong> Poți solicita anonimizarea datelor.</li>
                <li><strong>Dreptul la portabilitate:</strong> Transferul datelor către alt specialist.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" /> 5. Retenția Datelor
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Datele sunt păstrate pe durata desfășurării contractului terapeutic și conform obligațiilor legale de arhivare medicală (în general 10 ani pentru dosarele clinice). În cazul cererii de anonimizare, aplicăm o perioadă de grație de 15 zile înainte de ștergerea ireversibilă.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm">
                Pentru orice întrebări legat de datele tale, ne poți contacta la <br/>
                <span className="font-bold text-slate-600">dpo@cepaipatit.ro</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
