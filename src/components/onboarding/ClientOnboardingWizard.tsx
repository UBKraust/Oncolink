"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronRight, ChevronLeft, ShieldCheck, Heart, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitClientOnboarding } from "@/app/dashboard/clients/onboarding-actions";

const onboardingSchema = z.object({
  cnp_cif: z.string().min(1, "CNP/CIF este obligatoriu pentru facturare"),
  address: z.string().min(5, "Adresa completă este necesară"),
  emergency_contact_name: z.string().min(2, "Numele contactului este obligatoriu"),
  emergency_contact_phone: z.string().min(10, "Numărul de telefon este invalid"),
  emergency_contact_relation: z.string().min(2, "Vă rugăm specificați relația"),
  referral_source: z.string().min(1, "Vă rugăm selectați sursa"),
  referred_by_name: z.string().optional(),
  gdpr_consent: z.boolean().refine(val => val === true, "Acordul GDPR este obligatoriu"),
  terms_consent: z.boolean().refine(val => val === true, "Acceptarea termenilor este obligatorie"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface ClientOnboardingWizardProps {
  clientId: string;
  clientName: string;
}

export function ClientOnboardingWizard({ clientId, clientName }: ClientOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gdpr_consent: false,
      terms_consent: false,
    },
  });

  const referralSource = watch("referral_source");
  const progress = (step / 4) * 100;

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await submitClientOnboarding({
        id: clientId,
        cnp_cif: values.cnp_cif,
        address: values.address,
        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_phone: values.emergency_contact_phone,
        emergency_contact_relation: values.emergency_contact_relation,
        referral_source: values.referral_source,
        referred_by_name: values.referred_by_name,
        gdpr_consent_signed: values.gdpr_consent,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        alert("A apărut o eroare la trimitere. Vă rugăm să încercați din nou.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">E făcut!</h2>
          <p className="text-muted-foreground mx-auto max-w-sm">
            Datele tale au fost salvate securizat. Terapeutul tău are acum toate informațiile necesare pentru prima ședință.
          </p>
        </div>
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-6 space-y-4">
          <p className="text-sm font-medium">Ne vedem curând la Oncolink!</p>
          <Button asChild variant="outline" className="w-full">
            <a href="https://oncolink.ro">Vizitează Site-ul Oficial</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 p-1">
      {/* Header & Progress */}
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tight">Bun venit, {clientName}</h1>
          <p className="text-sm text-muted-foreground">
            Te rugăm să completezi acest scurt formular (Pasul {step}/4)
          </p>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span className={cn(step >= 1 && "text-primary")}>Facturare</span>
            <span className={cn(step >= 2 && "text-primary")}>Urgență</span>
            <span className={cn(step >= 3 && "text-primary")}>Recomandare</span>
            <span className={cn(step >= 4 && "text-primary")}>Acorduri</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Billing */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
              <Info className="h-4 w-4" />
              Datele sunt necesare conform legislației ANAF pentru emiterea facturii ședinței.
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnp_cif">CNP sau CIF (pentru companii)</Label>
                <Input id="cnp_cif" placeholder="Introdu CNP-ul tău" {...register("cnp_cif")} />
                {errors.cnp_cif && <p className="text-xs text-rose-500 font-medium">{errors.cnp_cif.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresa completă</Label>
                <Textarea 
                  id="address" 
                  placeholder="Strada, Număr, Bloc, Oraș, Județ" 
                  {...register("address")} 
                />
                {errors.address && <p className="text-xs text-rose-500 font-medium">{errors.address.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Emergency Contact */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <ShieldCheck className="h-4 w-4" />
              Acest contact va fi apelat doar în situații de urgență medicală sau risc iminent.
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Nume Persoană de Contact</Label>
                <Input id="emergency_contact_name" placeholder="Numele persoanei apropiate" {...register("emergency_contact_name")} />
                {errors.emergency_contact_name && <p className="text-xs text-rose-500 font-medium">{errors.emergency_contact_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Telefon</Label>
                  <Input id="emergency_contact_phone" placeholder="07xx xxx xxx" {...register("emergency_contact_phone")} />
                  {errors.emergency_contact_phone && <p className="text-xs text-rose-500 font-medium">{errors.emergency_contact_phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relation">Relația</Label>
                  <Input id="emergency_contact_relation" placeholder="ex: Soț, Mamă, Prieten" {...register("emergency_contact_relation")} />
                  {errors.emergency_contact_relation && <p className="text-xs text-rose-500 font-medium">{errors.emergency_contact_relation.message}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Referral */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="referral_source">Cum ai aflat despre noi?</Label>
              <Select 
                id="referral_source"
                name="referral_source"
                onChange={(e) => setValue("referral_source", e.target.value)}
              >
                <option value="">— Alege o opțiune —</option>
                <option value="MEDIC">Medic Specialist (Psihiatru, Oncolog, etc.)</option>
                <option value="FOST_PACIENT">Recomandare Fost Pacient / Prieten</option>
                <option value="INTERNET">Căutare Google / Social Media</option>
                <option value="SOCIAL_MEDIA">Facebook / Instagram / TikTok</option>
                <option value="ALTUL">Altă Sursă</option>
              </Select>
              {errors.referral_source && <p className="text-xs text-rose-500 font-medium">{errors.referral_source.message}</p>}
            </div>

            {(referralSource === "MEDIC" || referralSource === "FOST_PACIENT") && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                <Label htmlFor="referred_by_name">Cine te-a recomandat?</Label>
                <Input 
                  id="referred_by_name" 
                  placeholder="Numele complet al medicului sau persoanei" 
                  {...register("referred_by_name")} 
                />
                <p className="text-[10px] text-muted-foreground italic">Ne ajută să îi mulțumim profesional persoanei respective.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Consent */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4 rounded-xl border border-primary/20 bg-muted/30 p-6">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="gdpr_consent" 
                  onChange={(e) => setValue("gdpr_consent", (e.target as HTMLInputElement).checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="gdpr_consent" className="text-sm font-semibold leading-none cursor-pointer">
                    Acord prelucrare date (GDPR)
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sunt de acord cu colectarea și păstrarea datelor mele personale (CNP, istoric clinic) în sistemul securizat Oncolink.
                  </p>
                  {errors.gdpr_consent && <p className="text-xs text-rose-500 font-medium mt-1">{errors.gdpr_consent.message}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="terms_consent" 
                  onChange={(e) => setValue("terms_consent", (e.target as HTMLInputElement).checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="terms_consent" className="text-sm font-semibold leading-none cursor-pointer">
                    Accept Termenii Contractului
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Am citit și sunt de acord cu politica de confidențialitate și termenii de prestări servicii psihologice.
                  </p>
                  {errors.terms_consent && <p className="text-xs text-rose-500 font-medium mt-1">{errors.terms_consent.message}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
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

          {step < 4 ? (
            <Button type="button" onClick={nextStep} className="font-bold shadow-lg shadow-primary/20">
              Continuă
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200"
            >
              {isSubmitting ? "Se trimite..." : "Finalizează Aplicarea"}
              <UserPlus className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Trust Footer */}
      <div className="flex flex-col items-center gap-1.5 pt-10 text-[10px] text-muted-foreground lowercase opacity-60">
        <div className="flex items-center gap-1 font-bold">
          <ShieldCheck className="h-3 w-3" />
          Powered by Oncolink encrypted systems
        </div>
        <div>Standarde Colegiul Psihologilor din România</div>
      </div>
    </div>
  );
}
