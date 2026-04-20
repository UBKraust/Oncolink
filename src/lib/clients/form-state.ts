export interface ClientFormState {
  error: string | null;
  fieldErrors: Partial<
    Record<
      | "full_name"
      | "email"
      | "phone"
      | "cnp_cif"
      | "address"
      | "location"
      | "parent_name"
      | "parent_phone"
      | "company_name"
      | "session_price",
      string
    >
  >;
}
