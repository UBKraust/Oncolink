export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRISIS"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Risc scăzut",
  MEDIUM: "Risc moderat",
  HIGH: "Risc ridicat",
  CRISIS: "Criză",
};

export const RISK_LEVEL_BADGE_VARIANTS: Record<RiskLevel, "success" | "warning" | "destructive" | "default"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRISIS: "destructive",
};

export function isRiskLevel(value: string | null | undefined): value is RiskLevel {
  return RISK_LEVELS.includes(value as RiskLevel);
}

export type ServiceType =
  | "CLINICAL_PSYCHOLOGY"
  | "CBT"
  | "DBT"
  | "COUNSELING"
  | "MIXED"
  | "UNDECIDED";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  CLINICAL_PSYCHOLOGY: "Psihologie clinică",
  CBT: "Psihoterapie CBT",
  DBT: "Psihoterapie DBT",
  COUNSELING: "Consiliere psihologică",
  MIXED: "Mixt / de stabilit",
  UNDECIDED: "Nedefinit",
};

export type ServiceTypeBadgeVariant =
  | "default"
  | "outline"
  | "secondary"
  | "info"
  | "success"
  | "warning";

export const SERVICE_TYPE_BADGE_VARIANTS: Record<ServiceType, ServiceTypeBadgeVariant> = {
  CLINICAL_PSYCHOLOGY: "info",
  CBT: "success",
  DBT: "warning",
  COUNSELING: "default",
  MIXED: "secondary",
  UNDECIDED: "outline",
};

export const SERVICE_TRACK_STATUSES: Record<ServiceType, string[]> = {
  CLINICAL_PSYCHOLOGY: [
    "Onboarding complet",
    "Evaluare clinică programată",
    "Evaluare în desfășurare",
    "Teste administrate",
    "Raport în lucru",
    "Raport finalizat",
    "Feedback oferit",
    "Recomandare transmisă",
    "Închis",
  ],
  CBT: [
    "Evaluare inițială",
    "Formulare de caz",
    "Plan terapeutic activ",
    "În terapie",
    "Reevaluare",
    "Prevenție recădere",
    "Închis",
    "Follow-up",
  ],
  DBT: [
    "Screening DBT",
    "Evaluare risc",
    "Contract terapeutic",
    "Plan DBT activ",
    "Monitorizare intensă",
    "Stabilizare",
    "Generalizare abilități",
    "Follow-up",
    "Închis",
  ],
  COUNSELING: [
    "Clarificare nevoie",
    "Consiliere activă",
    "Reevaluare",
    "Recomandat psihoterapie",
    "Închis",
  ],
  MIXED: [],
  UNDECIDED: [],
};

export function getNextTrackStatus(serviceType: ServiceType, currentStatus: string | null): string | null {
  const statuses = SERVICE_TRACK_STATUSES[serviceType];
  if (!statuses.length) return null;
  if (!currentStatus) return statuses[0];
  const idx = statuses.indexOf(currentStatus);
  if (idx === -1 || idx === statuses.length - 1) return null;
  return statuses[idx + 1];
}

export function isServiceType(value: string | null | undefined): value is ServiceType {
  return ["CLINICAL_PSYCHOLOGY", "CBT", "DBT", "COUNSELING", "MIXED", "UNDECIDED"].includes(
    value ?? "",
  );
}

type NextActionContext = {
  serviceType: ServiceType;
  lifecycleStatus: string | null;
  serviceTrackStatus: string | null;
  gdprSigned: boolean | null;
  onboardingComplete: boolean;
  hasAppointments: boolean;
  riskLevel: string | null;
};

const DBT_TRACK_ACTIONS: Record<string, string> = {
  "Screening DBT": "Finalizează screening-ul și programează evaluarea de risc",
  "Evaluare risc": "Completează fișa de evaluare a riscului",
  "Contract terapeutic": "Semnează angajamentul terapeutic DBT",
  "Plan DBT activ": "Identifică comportamentele țintă și stabilește planul de lucru",
  "Monitorizare intensă": "Verifică diary card-ul săptămânii și actualizează planul de siguranță",
  "Stabilizare": "Evaluează progresul pe comportamentele țintă",
  "Generalizare abilități": "Monitorizează generalizarea abilităților DBT în viața cotidiană",
  "Follow-up": "Programează sesiunea de follow-up",
};

const CBT_TRACK_ACTIONS: Record<string, string> = {
  "Evaluare inițială": "Finalizează evaluarea inițială și identifică problemele principale",
  "Formulare de caz": "Completează formularea de caz CBT",
  "Plan terapeutic activ": "Definește obiectivele SMART și planul de intervenție",
  "În terapie": "Verifică tema pentru acasă și pregătește tehnicile pentru ședință",
  "Reevaluare": "Evaluează progresul față de obiectivele inițiale",
  "Prevenție recădere": "Elaborează planul de prevenție a recăderii",
  "Follow-up": "Programează sesiunea de follow-up",
};

const CLINICAL_TRACK_ACTIONS: Record<string, string> = {
  "Onboarding complet": "Programează evaluarea clinică inițială",
  "Evaluare clinică programată": "Pregătește instrumentele de evaluare pentru ședință",
  "Evaluare în desfășurare": "Continuă administrarea testelor psihologice",
  "Teste administrate": "Scorează și interpretează rezultatele testelor",
  "Raport în lucru": "Finalizează redactarea raportului psihologic",
  "Raport finalizat": "Programează ședința de feedback cu clientul",
  "Feedback oferit": "Redactează recomandările finale",
  "Recomandare transmisă": "Urmărește implementarea recomandărilor",
};

const COUNSELING_TRACK_ACTIONS: Record<string, string> = {
  "Clarificare nevoie": "Definește obiectivul principal al consilierii",
  "Consiliere activă": "Pregătește tehnicile de suport pentru ședința următoare",
  "Reevaluare": "Evaluează progresul față de obiectivul de consiliere",
  "Recomandat psihoterapie": "Asistă tranziția clientului către procesul de psihoterapie",
};

export function computeServiceTrackNextAction(ctx: NextActionContext): string {
  const { serviceType, lifecycleStatus, serviceTrackStatus, gdprSigned, onboardingComplete, hasAppointments, riskLevel } = ctx;

  if (!gdprSigned) return "Obține consimțământul GDPR semnat";

  // În onboarding, terapeutul are nevoie de un singur pas clinic concret,
  // nu de un mesaj generic care dublează starea lifecycle.
  if (!onboardingComplete) {
    switch (serviceType) {
      case "CLINICAL_PSYCHOLOGY":
        return "Completează fișa de anamneză și pregătește evaluarea clinică inițială";
      case "CBT":
        return "Definește obiectivele terapeutice SMART pentru pornirea planului CBT";
      case "DBT":
        return "Completează evaluarea de risc înainte de angajamentul terapeutic";
      case "COUNSELING":
        return "Clarifică obiectivul consilierii și stabilește planul scurt de lucru";
      default:
        return "Finalizează onboarding-ul clientului";
    }
  }

  // DBT risc ridicat — prioritate maximă indiferent de track status
  if (serviceType === "DBT" && (riskLevel === "HIGH" || riskLevel === "CRISIS")) {
    return "🔴 Actualizează planul de siguranță — risc ridicat activ";
  }

  // Dacă avem service_track_status, folosim acțiunile specifice
  if (serviceTrackStatus) {
    const trackAction = (() => {
      switch (serviceType) {
        case "DBT": return DBT_TRACK_ACTIONS[serviceTrackStatus];
        case "CBT": return CBT_TRACK_ACTIONS[serviceTrackStatus];
        case "CLINICAL_PSYCHOLOGY": return CLINICAL_TRACK_ACTIONS[serviceTrackStatus];
        case "COUNSELING": return COUNSELING_TRACK_ACTIONS[serviceTrackStatus];
        default: return null;
      }
    })();
    if (trackAction) return trackAction;
  }

  // Fallback pe lifecycle dacă nu avem track status
  if (lifecycleStatus === "LEAD" || lifecycleStatus === "ONBOARDING") {
    switch (serviceType) {
      case "CLINICAL_PSYCHOLOGY": return "Programează evaluarea clinică inițială";
      case "CBT": return "Programează ședința de evaluare inițială CBT";
      case "DBT": return "Completează screening-ul inițial DBT";
      case "COUNSELING": return "Programează ședința de clarificare a nevoii";
      default: return "Stabilește tipul de serviciu și programează prima ședință";
    }
  }

  if (!hasAppointments) return "Programează prima ședință";

  switch (serviceType) {
    case "CLINICAL_PSYCHOLOGY": return "Setează etapa curentă de evaluare";
    case "CBT": return "Setează etapa curentă a procesului CBT";
    case "DBT": return "Setează etapa curentă a procesului DBT";
    case "COUNSELING": return "Setează etapa curentă a consilierii";
    case "UNDECIDED":
    case "MIXED": return "Definește tipul de serviciu principal";
    default: return "Continuă planul de lucru";
  }
}
