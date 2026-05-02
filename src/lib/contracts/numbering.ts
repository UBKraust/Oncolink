import type {
  ContractLifecycleStatus,
  ContractTemplateVersion,
  TemplateType,
} from "@/lib/contracts/types";
import { CONTRACT_TEMPLATE_VERSIONS } from "@/lib/contracts/types";

export function getTemplateVersion(template: TemplateType): ContractTemplateVersion {
  return CONTRACT_TEMPLATE_VERSIONS[template];
}

export function buildDraftContractNumber(date = new Date()) {
  return `CTR-${date.getFullYear()}-DRAFT`;
}

export function buildInitialContractNumber(date = new Date()) {
  return buildDraftContractNumber(date);
}

export function getContractStatusLabel(status: ContractLifecycleStatus) {
  return status === "DRAFT" ? "DRAFT - NEEMIS" : "EMIS";
}
