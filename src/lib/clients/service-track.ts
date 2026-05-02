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

export function isServiceType(value: string | null | undefined): value is ServiceType {
  return ["CLINICAL_PSYCHOLOGY", "CBT", "DBT", "COUNSELING", "MIXED", "UNDECIDED"].includes(
    value ?? "",
  );
}

type NextActionContext = {
  serviceType: ServiceType;
  lifecycleStatus: string | null;
  gdprSigned: boolean | null;
  onboardingComplete: boolean;
  hasAppointments: boolean;
  riskLevel: string | null;
};

export function computeServiceTrackNextAction(ctx: NextActionContext): string {
  const { serviceType, lifecycleStatus, gdprSigned, onboardingComplete, hasAppointments, riskLevel } = ctx;

  if (!gdprSigned) return "Obține consimțământul GDPR semnat";
  if (!onboardingComplete) return "Finalizează onboarding-ul clientului";

  if (lifecycleStatus === "LEAD" || lifecycleStatus === "ONBOARDING") {
    switch (serviceType) {
      case "CLINICAL_PSYCHOLOGY": return "Programează evaluarea clinică inițială";
      case "CBT": return "Programează ședința de evaluare inițială CBT";
      case "DBT": return "Completează screening-ul inițial DBT";
      case "COUNSELING": return "Programează ședința de clarificare a nevoii";
      default: return "Stabilește tipul de serviciu și programează prima ședință";
    }
  }

  if (!hasAppointments) {
    return "Programează prima ședință";
  }

  switch (serviceType) {
    case "CLINICAL_PSYCHOLOGY":
      return "Adaugă bateria de teste psihologice";
    case "CBT":
      return "Definește obiectivele terapeutice";
    case "DBT":
      if (riskLevel === "HIGH" || riskLevel === "CRISIS") return "Actualizează planul de siguranță";
      return "Completează diary card-ul curent";
    case "COUNSELING":
      return "Clarifică obiectivul consilierii";
    case "UNDECIDED":
    case "MIXED":
      return "Definește tipul de serviciu principal";
    default:
      return "Continuă planul de lucru";
  }
}
