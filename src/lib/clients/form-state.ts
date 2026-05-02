export interface ClientFormState {
  error: string | null;
  fieldErrors: Partial<
    Record<
      | "full_name"
      | "email"
      | "phone"
      | "cnp_cif"
      | "address"
      | "date_of_birth"
      | "minor_cnp"
      | "client_id_series"
      | "client_id_number"
      | "location"
      | "parent_name"
      | "parent_phone"
      | "parent_1_email"
      | "parent_cnp"
      | "parent_address"
      | "parent_id_series"
      | "parent_id_number"
      | "company_name"
      | "company_address"
      | "company_iban"
      | "company_bank"
      | "session_price"
      | "session_frequency"
      | "report_frequency"
      | "send_report_to_parent"
      | "company_representative_name"
      | "company_representative_email"
      | "company_representative_role"
      | "company_reg_com"
      | "service_type",
      string
    >
  >;
  success?: boolean;
  clientId?: string;
}
