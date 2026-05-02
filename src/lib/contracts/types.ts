import type { TherapistSettings } from "@/app/dashboard/settings/settings-actions";
import type { Database } from "@/lib/supabase/types";
import type { ClientProfile } from "@/components/clients/types";

export type TemplateType = "STANDARD" | "MINOR" | "B2B" | "CAS";
export type ContractLifecycleStatus = "DRAFT" | "ISSUED";

export const CONTRACT_TEMPLATE_VERSIONS = {
  STANDARD: "STANDARD_v1.0",
  MINOR: "MINOR_v1.0",
  B2B: "B2B_v1.0",
  CAS: "CAS_v1.0",
} as const satisfies Record<TemplateType, string>;

export type ContractTemplateVersion = (typeof CONTRACT_TEMPLATE_VERSIONS)[TemplateType];
export type ReferralDocumentSummary = Pick<
  Database["public"]["Tables"]["referral_documents"]["Row"],
  "id" | "referral_number" | "referral_date" | "referring_doctor_code" | "uploaded_at"
>;

export interface MissingDataGroup {
  category: string;
  items: string[];
}

export interface ContractGeneratorContext {
  client: ClientProfile;
  settings: TherapistSettings | null;
  template: TemplateType;
  repName: string;
  repRole: string;
  regCom: string;
  referralNumber: string;
  referralDate: string;
  referringDoctor: string;
}

export interface ContractPdfData {
  contractNumber: string;
  startDate: string;
  clientName: string;
  clientCNP: string;
  clientAddress: string;
  clientBirthDate?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientIdSeries?: string;
  clientIdNumber?: string;
  therapistName: string;
  therapistCIF: string;
  therapistIBAN?: string;
  therapistPracticeName?: string;
  therapistPracticeAddress?: string;
  therapistPracticePhone?: string;
  therapistPracticeEmail?: string;
  therapistPracticeCaen?: string;
  therapistCPRCode?: string;
  sessionPrice: number;
  templateType?: TemplateType;
  templateVersion: ContractTemplateVersion;
  documentStatus: ContractLifecycleStatus;
  statusLabel: string;

  isMinor?: boolean;
  parent1Name?: string;
  parentCNP?: string;
  parentAddress?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentIdSeries?: string;
  parentIdNumber?: string;
  parent2Name?: string;
  parentsMaritalStatus?: string;
  courtSentenceNumber?: string;

  isB2B?: boolean;
  companyName?: string;
  companyCIF?: string;
  companyRegCom?: string;
  companyAddress?: string;
  companyIBAN?: string;
  companyBank?: string;
  representativeName?: string;
  representativeRole?: string;
  representativeEmail?: string;

  isCas?: boolean;
  referralNumber?: string;
  referralDate?: string;
  referringDoctor?: string;
  casContractNumber?: string;
  casCounty?: string;
}

export interface GeneratedPdfResult {
  blob: Blob;
  fileName: string;
}
