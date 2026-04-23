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
      | "session_price"
      | "session_frequency"
      | "report_frequency"
      | "send_report_to_parent"
      | "company_representative_name"
      | "company_representative_role"
      | "company_reg_com",
      string
    >
  >;
  success?: boolean;
  clientId?: string;
}
