type LifecycleBadgeVariant =
  | "default"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "secondary"
  | "info";

type LifecycleAppointment = {
  appointment_date: string;
  status: string;
};

type LifecycleClient = {
  gdpr_consent_signed: boolean | null;
  is_minor: boolean | null;
  legal_liability_consent_signed_at?: string | null;
  notes_anonymized_at: string | null;
  onboarding_completed_at?: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_1_email: string | null;
  parent_1_name?: string | null;
  parent_1_phone?: string | null;
  scheduled_anonymization_at: string | null;
  terms_consent_signed_at: string | null;
};

export type ClientLifecycleStatus =
  | "LEAD"
  | "ONBOARDING"
  | "PROGRAMAT"
  | "ACTIV"
  | "ANONIMIZAT";

export interface ClientLifecycle {
  status: ClientLifecycleStatus;
  label: string;
  description: string;
  badgeVariant: LifecycleBadgeVariant;
  stageLabel: string;
  nextActions: string[];
  summary: string;
  hasCompletedSession: boolean;
  hasUpcomingSession: boolean;
  hasGuardianContact: boolean;
  isMinor: boolean;
  isOnboardingComplete: boolean;
  isAnonymizationScheduled: boolean;
  needsGdprConsent: boolean;
  needsMinorLegalConsent: boolean;
}

export function deriveClientLifecycle(
  client: LifecycleClient,
  appointments: LifecycleAppointment[] = [],
): ClientLifecycle {
  const now = Date.now();
  const isMinor = Boolean(client.is_minor);
  const isAnonymized = Boolean(client.notes_anonymized_at);
  const isAnonymizationScheduled = Boolean(client.scheduled_anonymization_at);
  const needsGdprConsent = !client.gdpr_consent_signed;
  const hasGuardianContact = isMinor
    ? Boolean(
        client.parent_name ||
          client.parent_phone ||
          client.parent_1_name ||
          client.parent_1_phone ||
          client.parent_1_email,
      )
    : true;
  const needsMinorLegalConsent = isMinor && !client.legal_liability_consent_signed_at;
  const isOnboardingComplete = Boolean(client.onboarding_completed_at);
  const hasUpcomingSession = appointments.some((appointment) => {
    if (!["PROGRAMAT", "CONFIRMAT"].includes(appointment.status)) return false;
    return new Date(appointment.appointment_date).getTime() >= now;
  });
  const hasCompletedSession = appointments.some(
    (appointment) => appointment.status === "FINALIZAT",
  );

  const nextActions: string[] = [];

  if (isAnonymized) {
    nextActions.push("Păstrează doar istoricul administrativ și contabil necesar.");
  } else {
    if (needsGdprConsent) {
      nextActions.push("Trimite sau confirmă consimțământul GDPR.");
    }
    if (!isOnboardingComplete) {
      nextActions.push("Finalizează onboardingul administrativ.");
    }
    if (isMinor && !hasGuardianContact) {
      nextActions.push("Completează reprezentantul legal principal.");
    }
    if (needsMinorLegalConsent) {
      nextActions.push("Obține acordul de răspundere legală pentru minor.");
    }
    if (!hasUpcomingSession && !hasCompletedSession) {
      nextActions.push("Creează prima programare.");
    }
    if (hasUpcomingSession && !hasCompletedSession) {
      nextActions.push("Pregătește prima ședință și documentele lipsă.");
    }
    if (hasCompletedSession && !hasUpcomingSession) {
      nextActions.push("Programează următorul follow-up.");
    }
    if (isAnonymizationScheduled) {
      nextActions.push("Revizuiește anonimizarea programată înainte de termen.");
    }
  }

  if (isAnonymized) {
    return {
      status: "ANONIMIZAT",
      label: "Anonimizat",
      description: "Datele personale au fost eliminate, iar dosarul rămâne doar pentru retenție legală.",
      badgeVariant: "outline",
      stageLabel: "Retenție legală",
      nextActions,
      summary: "Fișa nu mai poate fi folosită pentru onboarding sau programări noi.",
      hasCompletedSession,
      hasUpcomingSession,
      hasGuardianContact,
      isMinor,
      isOnboardingComplete,
      isAnonymizationScheduled,
      needsGdprConsent,
      needsMinorLegalConsent,
    };
  }

  if (hasCompletedSession) {
    return {
      status: "ACTIV",
      label: "Activ",
      description: "Clientul are deja istoric clinic și poate continua în fluxul curent de follow-up.",
      badgeVariant: "success",
      stageLabel: "Lucru clinic",
      nextActions,
      summary: hasUpcomingSession
        ? "Există continuitate clinică prin sesiuni deja programate."
        : "Are istoric clinic, dar merită verificat următorul pas terapeutic.",
      hasCompletedSession,
      hasUpcomingSession,
      hasGuardianContact,
      isMinor,
      isOnboardingComplete,
      isAnonymizationScheduled,
      needsGdprConsent,
      needsMinorLegalConsent,
    };
  }

  if (hasUpcomingSession) {
    return {
      status: "PROGRAMAT",
      label: "Programat",
      description: "Prima relație activă cu cabinetul este planificată, dar nu există încă o ședință finalizată.",
      badgeVariant: "info",
      stageLabel: "Prima ședință",
      nextActions,
      summary: "Clientul a trecut de faza de lead și are deja o întâlnire viitoare.",
      hasCompletedSession,
      hasUpcomingSession,
      hasGuardianContact,
      isMinor,
      isOnboardingComplete,
      isAnonymizationScheduled,
      needsGdprConsent,
      needsMinorLegalConsent,
    };
  }

  if (isOnboardingComplete || client.gdpr_consent_signed || client.terms_consent_signed_at) {
    return {
      status: "ONBOARDING",
      label: "Onboarding",
      description: "Fișa are suficiente date administrative pentru a continua către prima programare.",
      badgeVariant: "warning",
      stageLabel: "Pregătire administrativă",
      nextActions,
      summary: "Pasul natural următor este programarea și verificarea documentelor obligatorii.",
      hasCompletedSession,
      hasUpcomingSession,
      hasGuardianContact,
      isMinor,
      isOnboardingComplete,
      isAnonymizationScheduled,
      needsGdprConsent,
      needsMinorLegalConsent,
    };
  }

  return {
    status: "LEAD",
    label: "Lead nou",
    description: "Există doar fișa minimă; onboardingul și prima programare nu sunt încă pornite.",
    badgeVariant: "secondary",
    stageLabel: "Captare inițială",
    nextActions,
    summary: "Bun pentru trimitere onboarding, verificare duplicate și calificare rapidă.",
    hasCompletedSession,
    hasUpcomingSession,
    hasGuardianContact,
    isMinor,
    isOnboardingComplete,
    isAnonymizationScheduled,
    needsGdprConsent,
    needsMinorLegalConsent,
  };
}
