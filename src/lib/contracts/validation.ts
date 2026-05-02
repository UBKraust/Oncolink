import type { ContractGeneratorContext, MissingDataGroup } from "@/lib/contracts/types";

function createGroup(category: string, items: Array<string | false | null | undefined>): MissingDataGroup | null {
  const filtered = items.filter((item): item is string => Boolean(item));
  if (filtered.length === 0) return null;
  return { category, items: filtered };
}

export function getMissingContractData(context: ContractGeneratorContext): MissingDataGroup[] {
  const { client, settings, template, repName, repRole, referralNumber, referralDate } = context;
  const groups: MissingDataGroup[] = [];

  const therapistGroup = createGroup("Date cabinet / terapeut", [
    !settings?.full_name && "Completează numele terapeutului.",
    !settings?.cif && "Completează CIF/CUI cabinet.",
    !settings?.practice_name && "Completează denumirea cabinetului.",
    !settings?.practice_address && "Completează adresa cabinetului.",
    (!settings?.practice_phone || !settings?.practice_email) &&
      "Completează telefonul și e-mailul cabinetului.",
  ]);
  if (therapistGroup) groups.push(therapistGroup);

  const clientGroup = createGroup("Date client", [
    !client.full_name && "Completează numele clientului.",
    !client.address && "Completează adresa clientului.",
    template !== "MINOR" && !client.cnp_cif && "Completează CNP-ul sau CIF-ul clientului.",
  ]);
  if (clientGroup) groups.push(clientGroup);

  if (template === "MINOR") {
    const minorGroup = createGroup("Date reprezentant legal minor", [
      !client.minor_cnp && "Completează CNP-ul minorului.",
      !(client.parent_1_name || client.parent_name) && "Completează numele reprezentantului legal.",
      !client.parent_cnp && "Completează CNP-ul reprezentantului legal.",
    ]);
    if (minorGroup) groups.push(minorGroup);
  }

  if (template === "B2B") {
    const b2bGroup = createGroup("Date firmă / B2B", [
      !client.company_name && "Completează numele firmei.",
      !repName.trim() && "Completează numele reprezentantului legal.",
      !repRole.trim() && "Completează calitatea reprezentantului legal.",
    ]);
    if (b2bGroup) groups.push(b2bGroup);
  }

  if (template === "CAS") {
    const casGroup = createGroup("Date CAS", [
      !settings?.cas_active && "Activează CAS în setările cabinetului.",
      !settings?.cas_contract_number && "Completează numărul contractului CAS din Setări.",
      !referralNumber.trim() && "Completează numărul biletului de trimitere.",
      !referralDate.trim() && "Completează data biletului de trimitere.",
    ]);
    if (casGroup) groups.push(casGroup);
  }

  return groups;
}
