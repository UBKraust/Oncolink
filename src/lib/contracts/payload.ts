import type { ContractLifecycleStatus, ContractGeneratorContext, ContractPdfData } from "@/lib/contracts/types";
import { getContractStatusLabel, getTemplateVersion } from "@/lib/contracts/numbering";

export function formatDateForDisplay(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ro-RO");
}

export function formatDateForInput(value?: string | null) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function buildContractPayload(
  context: ContractGeneratorContext,
  options: {
    contractNumber: string;
    status: ContractLifecycleStatus;
  },
): ContractPdfData | null {
  const { client, settings, template, regCom, repName, repRole, referralNumber, referralDate, referringDoctor } =
    context;

  if (!settings) return null;

  return {
    contractNumber: options.contractNumber,
    startDate: new Date().toLocaleDateString("ro-RO"),
    clientName: client.full_name || "—",
    clientCNP: template === "MINOR" ? client.minor_cnp || "—" : client.cnp_cif || "—",
    clientAddress: client.address || "—",
    clientBirthDate: client.date_of_birth ? formatDateForDisplay(client.date_of_birth) : undefined,
    clientPhone: client.phone || undefined,
    clientEmail: client.email || undefined,
    clientIdSeries: client.client_id_series || undefined,
    clientIdNumber: client.client_id_number || undefined,
    therapistName: settings.full_name || "—",
    therapistCIF: settings.cif || "—",
    therapistCPRCode: settings.cpr_code || undefined,
    therapistIBAN: settings.iban || undefined,
    therapistPracticeName: settings.practice_name || undefined,
    therapistPracticeAddress: settings.practice_address || undefined,
    therapistPracticePhone: settings.practice_phone || undefined,
    therapistPracticeEmail: settings.practice_email || undefined,
    therapistPracticeCaen: settings.practice_caen || undefined,
    sessionPrice: Number(client.session_price) || settings.default_session_price,
    templateType: template,
    templateVersion: getTemplateVersion(template),
    documentStatus: options.status,
    statusLabel: getContractStatusLabel(options.status),
    isMinor: template === "MINOR",
    parent1Name: client.parent_1_name || client.parent_name || undefined,
    parentCNP: template === "MINOR" ? client.parent_cnp || client.cnp_cif || undefined : undefined,
    parentAddress: template === "MINOR" ? client.parent_address || client.address || undefined : undefined,
    parentPhone: client.parent_1_phone || client.parent_phone || undefined,
    parentEmail: client.parent_1_email || undefined,
    parentIdSeries: client.parent_id_series || undefined,
    parentIdNumber: client.parent_id_number || undefined,
    parent2Name: client.parent_2_name || undefined,
    parentsMaritalStatus: client.parents_marital_status || undefined,
    isB2B: template === "B2B",
    companyName: client.company_name || undefined,
    companyCIF: client.cnp_cif || undefined,
    companyAddress: client.company_address || client.address || undefined,
    companyIBAN: client.company_iban || undefined,
    companyBank: client.company_bank || undefined,
    companyRegCom: regCom || undefined,
    representativeName: repName || undefined,
    representativeRole: repRole || undefined,
    representativeEmail: client.company_representative_email || client.email || undefined,
    isCas: template === "CAS",
    referralNumber,
    referralDate: formatDateForDisplay(referralDate),
    referringDoctor: referringDoctor || undefined,
    casContractNumber: settings.cas_contract_number || undefined,
    casCounty: settings.cas_county || undefined,
  };
}
