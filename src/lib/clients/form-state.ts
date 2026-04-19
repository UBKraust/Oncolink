export interface ClientFormState {
  error: string | null;
  fieldErrors: Partial<
    Record<"full_name" | "email" | "phone" | "cnp_cif" | "address", string>
  >;
}
