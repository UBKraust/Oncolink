"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Upload, 
  FileText,
  UserPlus,
  Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitMinorOnboarding } from "@/app/dashboard/clients/onboarding-actions";

const minorOnboardingSchema = z.object({
  // Guardian Info
  parent_1_name: z.string().min(2, "Numele complet al părintelui este obligatoriu"),
  parent_1_phone: z.string().min(10, "Numărul de telefon este invalid"),
  parent_1_email: z.string().email("Adresa de email este invalidă"),
  cnp_cif: z.string().min(13, "CNP-ul este obligatoriu pentru facturare (13 caractere)"),
  address: z.string().min(5, "Adresa completă este necesară"),
  
  // Minor Info
  full_name: z.string().min(2, "Numele complet al minorului este obligatoriu"),
  minor_cnp: z.string().min(13, "CNP-ul minorului este obligatoriu"),
  
  // Legal Status
  parents_marital_status: z.string().min(1, "Vă rugăm selectați situația juridică"),
  parent_2_name: z.string().optional(),
  parent_2_phone: z.string().optional(),
  
  // Referral
  referral_source: z.string().min(1, "Vă rugăm selectați sursa"),
  referred_by_name: z.string().optional(),
  
  // Consents
  legal_liability_consent: z.boolean().refine(val => val === true, "Asumarea realității datelor este obligatorie"),
  gdpr_consent: z.boolean().refine(val => val === true, "Acordul GDPR este obligatoriu"),
});

type MinorOnboardingValues = z.infer<typeof minorOnboardingSchema>;

export function MinorOnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MinorOnboardingValues>({
    resolver: zodResolver(minorOnboardingSchema),
    defaultValues: {
      legal_liability_consent: false,
      gdpr_consent: false,
    },
  });

  const maritalStatus = watch("parents_marital_status");
  const progress = (step / 5) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (values: MinorOnboardingValues) => {
    if ((maritalStatus === "DIVORTATI_CUSTODIE_COMUNA" || maritalStatus === "DIVORTATI_CUSTODIE_EXCLUSIVA") && !file) {
      alert("Vă rugăm să încărcați documentul doveditor solicitat!");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitMinorOnboarding(values, file ? { custody: file } : undefined);
      if (result.success) {
        setIsSuccess(true);
      } else {
        alert("Eroare: " + result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-1000">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
          <Check className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Onboarding Finalizat</h2>
          <p className="text-muted-foreground mx-auto max-w-sm">
            Vă mulțumim! Dosarul minorului este acum complet și pregătit pentru prima ședință. Terapeutul va analiza documentele încărcate.
          </p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8 flex flex-col gap-4">
          <p className="text-sm font-medium italic">"Siguranța legala a copilului este prioritatea noastră."</p>
          <Button asChild className="w-full font-bold">
            <a href="https://cepaipatit.ro">Reveniți la site</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-1">
      {/* Header & Progress */}
      <div className="space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Înregistrare Minor</h1>
          <p className="text-sm text-slate-500 font-medium">Pasul {step} din 5: Acte legale și reprezentare</p>
        </div>
        <div className="space-y-3">
          <Progress value={progress} className="h-1.5" />
          <div className="grid grid-cols-5 gap-1 text-[9px] uppercase font-black tracking-wider text-slate-400 text-center">
            <span className={cn(step >= 1 && "text-primary")}>Părinte</span>
            <span className={cn(step >= 2 && "text-primary")}>Minor</span>
            <span className={cn(step >= 3 && "text-primary")}>Custodie</span>
            <span className={cn(step >= 4 && "text-primary")}>Surse</span>
            <span className={cn(step >= 5 && "text-primary")}>Asumare</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Parent Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex gap-3 text-sm text-blue-700">
              <Info className="h-5 w-5 shrink-0" />
              <p>Acest formular trebuie completat de părintele sau reprezentantul legal al minorului.</p>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_1_name">Nume Complet Părinte (Reprezentant Legal)</Label>
                <Input id="parent_1_name" placeholder="Popescu Ion" {...register("parent_1_name")} />
                {errors.parent_1_name && <p className="text-xs text-rose-500 font-medium">{errors.parent_1_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_1_phone">Telefon</Label>
                  <Input id="parent_1_phone" placeholder="07xx xxx xxx" {...register("parent_1_phone")} />
                  {errors.parent_1_phone && <p className="text-xs text-rose-500 font-medium">{errors.parent_1_phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_1_email">Email</Label>
                  <Input id="parent_1_email" placeholder="email@exemplu.ro" {...register("parent_1_email")} />
                  {errors.parent_1_email && <p className="text-xs text-rose-500 font-medium">{errors.parent_1_email.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnp_cif">CNP Părinte (pentru facturare conform ANAF)</Label>
                <Input id="cnp_cif" placeholder="188xxxxxxxxxx" {...register("cnp_cif")} />
                {errors.cnp_cif && <p className="text-xs text-rose-500 font-medium">{errors.cnp_cif.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresa completă de facturare</Label>
                <Textarea id="address" placeholder="Strada, Nr, Bloc, Oraș..." {...register("address")} />
                {errors.address && <p className="text-xs text-rose-500 font-medium">{errors.address.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Minor Info */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nume Complet Minor (Pacient)</Label>
                <Input id="full_name" placeholder="Nume Prenume Copil" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-rose-500 font-medium">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minor_cnp">CNP Minor (pentru fișa medicală)</Label>
                <Input id="minor_cnp" placeholder="5xxxxxxxxxxxx" {...register("minor_cnp")} />
                {errors.minor_cnp && <p className="text-xs text-rose-500 font-medium">{errors.minor_cnp.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Legal Situation (The "Bomb" Step) */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Atenție la regimul juridic!</p>
                <p className="text-xs opacity-80">Conform legii, dacă părinții sunt divorțați cu custodie comună, este obligatoriu acordul ambilor părinți pentru terapie.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parents_marital_status">Situația juridică a părinților</Label>
                <Select 
                  id="parents_marital_status" 
                  onChange={(e) => setValue("parents_marital_status", e.target.value)}
                >
                  <option value="">— Alege Situația —</option>
                  <option value="CASATORITI">Căsătoriți</option>
                  <option value="DIVORTATI_CUSTODIE_COMUNA">Divorțați — Custodie Comună</option>
                  <option value="DIVORTATI_CUSTODIE_EXCLUSIVA">Divorțați — Custodie Exclusivă</option>
                </Select>
                {errors.parents_marital_status && <p className="text-xs text-rose-500 font-medium">{errors.parents_marital_status.message}</p>}
              </div>

              {(maritalStatus === "DIVORTATI_CUSTODIE_COMUNA" || maritalStatus === "DIVORTATI_CUSTODIE_EXCLUSIVA") && (
                <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/30 p-6 animate-in zoom-in-95 duration-500">
                  <p className="text-sm font-bold text-rose-900">Încărcare document obligatoriu:</p>
                  <p className="text-xs text-rose-700">
                    {maritalStatus === "DIVORTATI_CUSTODIE_COMUNA" 
                      ? "Vă rugăm încărcați Acordul scris al celuilalt părinte (poză sau PDF)." 
                      : "Vă rugăm încărcați Sentința Judecătorească definitivă de custodie exclusivă."}
                  </p>
                  <div className="relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={handleFileChange}
                      accept=".pdf,image/*"
                    />
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-rose-200 rounded-xl p-8 transition-colors group-hover:border-rose-400 group-hover:bg-rose-50">
                      {file ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <Check className="h-5 w-5" /> {file.name.substring(0, 20)}...
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-rose-300 mb-2" />
                          <span className="text-xs font-bold text-rose-400">Click sau Trage fișierul aici</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {maritalStatus === "DIVORTATI_CUSTODIE_COMUNA" && (
                <div className="space-y-4">
                  <Label>Date Contact Celălalt Părinte (Părinte 2)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Nume Părinte 2" {...register("parent_2_name")} />
                    <Input placeholder="Telefon Părinte 2" {...register("parent_2_phone")} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Referral Info */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referral_source">Cum ați aflat despre cabinetul nostru?</Label>
                <Select id="referral_source" onChange={(e) => setValue("referral_source", e.target.value)}>
                   <option value="">— Alege o opțiune —</option>
                   <option value="MEDIC">Recomandare Medic</option>
                   <option value="FOST_PACIENT">Fost Pacient / Școală</option>
                   <option value="INTERNET">Căutare Google</option>
                   <option value="SOCIAL_MEDIA">Instagram / Facebook</option>
                   <option value="ALTUL">Altă sursă</option>
                </Select>
                {errors.referral_source && <p className="text-xs text-rose-500 font-medium">{errors.referral_source.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="referred_by_name">Cine v-a recomandat? (opțional)</Label>
                <Input id="referred_by_name" placeholder="ex: Dr. Popescu, Școala X..." {...register("referred_by_name")} />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Consents & Liability */}
        {step === 5 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="rounded-2xl border-4 border-rose-600 bg-rose-50 p-6 space-y-4">
                <div className="flex items-start gap-4">
                   <div className="h-8 w-8 bg-rose-600 rounded-full flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-white" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Declarație pe proprie răspundere</p>
                      <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                        Prin prezenta declar că datele furnizate cu privire la identitatea minorului și regimul său juridic sunt conforme cu realitatea. Înțeleg că furnizarea de informații false despre custodia copilului poate atrage răspunderea civilă sau penală conform Codului Civil Român.
                      </p>
                      <Link href="/legal/declaration" target="_blank" className="text-[10px] text-rose-600 font-bold underline flex items-center gap-1 hover:text-rose-700">
                        <FileText className="h-3 w-3" /> Vezi textul legal complet și printează
                      </Link>
                   </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-rose-200">
                  <Checkbox 
                    id="legal_liability_consent" 
                    onChange={(e) => setValue("legal_liability_consent", (e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="legal_liability_consent" className="text-xs font-black text-rose-950 cursor-pointer">
                    Îmi asum întreaga responsabilitate legală pentru datele furnizate.
                  </label>
                </div>
                {errors.legal_liability_consent && <p className="text-xs text-rose-600 font-bold">{errors.legal_liability_consent.message}</p>}
             </div>

             <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="gdpr_consent" 
                    onChange={(e) => setValue("gdpr_consent", (e.target as HTMLInputElement).checked)}
                  />
                  <div className="grid gap-1">
                    <label htmlFor="gdpr_consent" className="text-sm font-bold leading-none cursor-pointer">Acord GDPR & Servicii</label>
                    <p className="text-[10px] text-slate-500">Sunt de acord cu prelucrarea datelor medicale pentru mine și minor conform legii.</p>
                  </div>
                </div>
                {errors.gdpr_consent && <p className="text-xs text-rose-500 font-medium">{errors.gdpr_consent.message}</p>}
             </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={cn(step === 1 && "invisible")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi
          </Button>

          {step < 5 ? (
            <Button type="button" onClick={nextStep} className="font-bold px-8 py-6 rounded-xl shadow-xl shadow-primary/20">
              Următorul Pas
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-emerald-600 hover:bg-emerald-700 font-black px-10 py-6 rounded-xl shadow-xl shadow-emerald-200"
            >
              {isSubmitting ? "Se trimite..." : "Confirm Înscrierea Minorului"}
              <UserPlus className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
