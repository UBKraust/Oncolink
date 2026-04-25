import type { Database } from "@/lib/supabase/types";

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

type SupabaseLike = {
  from: (table: "clients") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: { id: string; full_name?: string | null } | null; error: { message: string } | null }>;
        };
        maybeSingle: () => Promise<{ data: { id: string; full_name?: string | null } | null; error: { message: string } | null }>;
      };
      maybeSingle: () => Promise<{ data: { id: string; full_name?: string | null } | null; error: { message: string } | null }>;
    };
    insert: (payload: ClientInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string }; error: { message: string } | null }>;
      };
    };
    update: (payload: ClientUpdate) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "") || "";
  return digits || null;
}

function normalizeName(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() || null;
}

async function findClientByField(
  db: SupabaseLike,
  therapistId: string,
  field: string,
  value?: string | null,
) {
  if (!value) return null;

  const { data, error } = await db
    .from("clients")
    .select("id, full_name")
    .eq("therapist_id", therapistId)
    .eq(field, value)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function findExistingClientId(
  db: SupabaseLike,
  therapistId: string,
  input: {
    id?: string | null;
    email?: string | null;
    phone?: string | null;
    cnp_cif?: string | null;
    minor_cnp?: string | null;
    full_name?: string | null;
    parent_1_email?: string | null;
    parent_1_phone?: string | null;
  },
) {
  const explicitId = input.id?.trim() || null;
  if (explicitId) {
    return (await findClientByField(db, therapistId, "id", explicitId))?.id ?? null;
  }

  const minorCnp = input.minor_cnp?.trim() || null;
  if (minorCnp) {
    const byMinorCnp = (await findClientByField(db, therapistId, "minor_cnp", minorCnp))?.id ?? null;
    if (byMinorCnp) return byMinorCnp;
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (normalizedEmail) {
    const byEmail = (await findClientByField(db, therapistId, "email", normalizedEmail))?.id ?? null;
    if (byEmail) return byEmail;
  }

  const normalizedPhone = normalizePhone(input.phone);
  if (normalizedPhone) {
    const byPhone = (await findClientByField(db, therapistId, "phone", normalizedPhone))?.id ?? null;
    if (byPhone) return byPhone;
  }

  const normalizedFullName = normalizeName(input.full_name);
  const parentEmail = normalizeEmail(input.parent_1_email);
  if (parentEmail && normalizedFullName) {
    const byParentEmail = await findClientByField(db, therapistId, "parent_1_email", parentEmail);
    if (byParentEmail && normalizeName(byParentEmail.full_name) === normalizedFullName) {
      return byParentEmail.id;
    }
  }

  const parentPhone = normalizePhone(input.parent_1_phone);
  if (parentPhone && normalizedFullName) {
    const byParentPhone = await findClientByField(db, therapistId, "parent_1_phone", parentPhone);
    if (byParentPhone && normalizeName(byParentPhone.full_name) === normalizedFullName) {
      return byParentPhone.id;
    }
  }

  const cnpCif = input.cnp_cif?.trim() || null;
  if (cnpCif) {
    const byIdentifier = await findClientByField(db, therapistId, "cnp_cif", cnpCif);
    if (!byIdentifier) return null;
    if (!normalizedFullName || normalizeName(byIdentifier.full_name) === normalizedFullName) {
      return byIdentifier.id;
    }
  }

  return null;
}

export async function upsertClientByIdentifiers(
  db: SupabaseLike,
  therapistId: string,
  identifiers: Parameters<typeof findExistingClientId>[2],
  payload: ClientInsert,
) {
  const existingId = await findExistingClientId(db, therapistId, identifiers);

  if (existingId) {
    const updatePayload: ClientUpdate = { ...payload };
    delete updatePayload.therapist_id;

    const { data, error } = await db
      .from("clients")
      .update(updatePayload)
      .eq("id", existingId)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { id: data?.id ?? existingId, created: false as const };
  }

  const { data, error } = await db
    .from("clients")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, created: true as const };
}
