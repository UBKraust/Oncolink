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
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          cnp_cif?: string | null;
          address?: string | null;
          gdpr_consent_signed?: boolean;
          contract_url?: string | null;
          notes_anonymized_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          cnp_cif?: string | null;
          address?: string | null;
          gdpr_consent_signed?: boolean;
          contract_url?: string | null;
          notes_anonymized_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
        Insert: {
          id?: string;
          client_id: string;
          appointment_date: string;
          duration_minutes?: number;
          status?: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          payment_link?: string | null;
          is_external_duty?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          appointment_date?: string;
          duration_minutes?: number;
          status?: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          payment_link?: string | null;
          is_external_duty?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          appointment_id: string;
          encrypted_content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          encrypted_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          encrypted_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_appointment_id_fkey";
            columns: ["appointment_id"];
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          id?: string;
          appointment_id?: string | null;
          smartbill_series?: string | null;
          smartbill_number?: string | null;
          amount?: number | null;
          status?: string;
          smartbill_id?: string | null;
          issued_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string | null;
          smartbill_series?: string | null;
          smartbill_number?: string | null;
          amount?: number | null;
          status?: string;
          smartbill_id?: string | null;
          issued_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          therapist_id: string | null;
          action_type: string | null;
          client_initials: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          therapist_id?: string | null;
          action_type?: string | null;
          client_initials?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string | null;
          action_type?: string | null;
          client_initials?: string | null;
          timestamp?: string;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};
