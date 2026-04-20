export interface AppointmentFormState {
  error: string | null;
  fieldErrors: Partial<
    Record<
      | "client_id"
      | "appointment_date"
      | "duration_minutes"
      | "status"
      | "location"
      | "meet_link",
      string
    >
  >;
}
