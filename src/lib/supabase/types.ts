export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          cnp_cif: string | null;
          address: string | null;
          gdpr_consent_signed: boolean;
          contract_url: string | null;
          notes_anonymized_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          full_name?: string | null;
          email?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          appointment_date: string;
          duration_minutes: number;
          status: string;
          google_event_id: string | null;
          meet_link: string | null;
          payment_link: string | null;
          is_external_duty: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          client_id: string;
          appointment_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
      };
      notes: {
        Row: {
          id: string;
          appointment_id: string;
          encrypted_content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          appointment_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          appointment_id: string | null;
          smartbill_series: string | null;
          smartbill_number: string | null;
          amount: number | null;
          status: string;
          smartbill_id: string | null;
          issued_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          therapist_id: string | null;
          action_type: string | null;
          client_initials: string | null;
          timestamp: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
