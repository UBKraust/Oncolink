export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string | null;
          client_initials: string | null;
          id: string;
          therapist_id: string | null;
          timestamp: string;
        };
        Insert: {
          action_type?: string | null;
          client_initials?: string | null;
          id?: string;
          therapist_id?: string | null;
          timestamp?: string;
        };
        Update: {
          action_type?: string | null;
          client_initials?: string | null;
          id?: string;
          therapist_id?: string | null;
          timestamp?: string;
        };
        Relationships: [];
      };
      appointment_action_tokens: {
        Row: {
          action: string;
          appointment_id: string;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          revoked_at: string | null;
          therapist_id: string;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          action: string;
          appointment_id: string;
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          revoked_at?: string | null;
          therapist_id: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          action?: string;
          appointment_id?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          therapist_id?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          appointment_date: string;
          client_id: string;
          created_at: string;
          duration_minutes: number;
          google_event_id: string | null;
          id: string;
          is_external_duty: boolean;
          meet_link: string | null;
          payment_link: string | null;
          price: number | null;
          referral_document_url: string | null;
          referral_drive_file_id: string | null;
          status: string;
          therapist_id: string | null;
        };
        Insert: {
          appointment_date: string;
          client_id: string;
          created_at?: string;
          duration_minutes?: number;
          google_event_id?: string | null;
          id?: string;
          is_external_duty?: boolean;
          meet_link?: string | null;
          payment_link?: string | null;
          price?: number | null;
          referral_document_url?: string | null;
          referral_drive_file_id?: string | null;
          status?: string;
          therapist_id?: string | null;
        };
        Update: {
          appointment_date?: string;
          client_id?: string;
          created_at?: string;
          duration_minutes?: number;
          google_event_id?: string | null;
          id?: string;
          is_external_duty?: boolean;
          meet_link?: string | null;
          payment_link?: string | null;
          price?: number | null;
          referral_document_url?: string | null;
          referral_drive_file_id?: string | null;
          status?: string;
          therapist_id?: string | null;
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
      assessments: {
        Row: {
          created_at: string | null;
          id: string;
          therapist_id: string | null;
          title: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          therapist_id?: string | null;
          title?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          therapist_id?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      cabinet_expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string | null;
          description: string;
          expense_date: string;
          id: string;
          receipt_path: string | null;
          receipt_url: string | null;
          therapist_id: string | null;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string | null;
          description: string;
          expense_date: string;
          id?: string;
          receipt_path?: string | null;
          receipt_url?: string | null;
          therapist_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string | null;
          description?: string;
          expense_date?: string;
          id?: string;
          receipt_path?: string | null;
          receipt_url?: string | null;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      client_assessments: {
        Row: {
          ai_interpretation: string | null;
          appointment_id: string | null;
          calculated_score: Json | null;
          client_id: string | null;
          created_at: string | null;
          id: string;
          raw_answers: Json | null;
          test_id: string | null;
          therapist_id: string | null;
        };
        Insert: {
          ai_interpretation?: string | null;
          appointment_id?: string | null;
          calculated_score?: Json | null;
          client_id?: string | null;
          created_at?: string | null;
          id?: string;
          raw_answers?: Json | null;
          test_id?: string | null;
          therapist_id?: string | null;
        };
        Update: {
          ai_interpretation?: string | null;
          appointment_id?: string | null;
          calculated_score?: Json | null;
          client_id?: string | null;
          created_at?: string | null;
          id?: string;
          raw_answers?: Json | null;
          test_id?: string | null;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      client_crisis_notes: {
        Row: {
          client_id: string;
          contact_method: string | null;
          created_at: string | null;
          id: string;
          note: string;
          therapist_id: string | null;
        };
        Insert: {
          client_id: string;
          contact_method?: string | null;
          created_at?: string | null;
          id?: string;
          note: string;
          therapist_id?: string | null;
        };
        Update: {
          client_id?: string;
          contact_method?: string | null;
          created_at?: string | null;
          id?: string;
          note?: string;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          address: string | null;
          billing_type: string | null;
          client_id_number: string | null;
          client_id_series: string | null;
          cnp_cif: string | null;
          company_name: string | null;
          company_address: string | null;
          company_bank: string | null;
          company_iban: string | null;
          company_reg_com: string | null;
          company_representative_email: string | null;
          company_representative_name: string | null;
          company_representative_role: string | null;
          contract_url: string | null;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          email: string | null;
          full_name: string | null;
          gdpr_consent_signed: boolean;
          id: string;
          is_minor: boolean | null;
          legal_liability_consent_signed_at: string | null;
          location: string | null;
          minor_cnp: string | null;
          needs_legal_review: boolean | null;
          notes_anonymized_at: string | null;
          onboarding_completed_at: string | null;
          parent_1_email: string | null;
          parent_1_name: string | null;
          parent_1_phone: string | null;
          parent_2_email: string | null;
          parent_2_name: string | null;
          parent_2_phone: string | null;
          parent_address: string | null;
          parent_cnp: string | null;
          parent_id_number: string | null;
          parent_id_series: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          parents_marital_status: string | null;
          phone: string | null;
          referral_source: string | null;
          referred_by_name: string | null;
          report_frequency: string | null;
          scheduled_anonymization_at: string | null;
          send_report_to_parent: boolean | null;
          session_frequency: string | null;
          session_price: number | null;
          therapist_id: string | null;
          terms_consent_signed_at: string | null;
        };
        Insert: {
          address?: string | null;
          billing_type?: string | null;
          client_id_number?: string | null;
          client_id_series?: string | null;
          cnp_cif?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          company_bank?: string | null;
          company_iban?: string | null;
          company_reg_com?: string | null;
          company_representative_email?: string | null;
          company_representative_name?: string | null;
          company_representative_role?: string | null;
          contract_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          email?: string | null;
          full_name?: string | null;
          gdpr_consent_signed?: boolean;
          id?: string;
          is_minor?: boolean | null;
          legal_liability_consent_signed_at?: string | null;
          location?: string | null;
          minor_cnp?: string | null;
          needs_legal_review?: boolean | null;
          notes_anonymized_at?: string | null;
          onboarding_completed_at?: string | null;
          parent_1_email?: string | null;
          parent_1_name?: string | null;
          parent_1_phone?: string | null;
          parent_2_email?: string | null;
          parent_2_name?: string | null;
          parent_2_phone?: string | null;
          parent_address?: string | null;
          parent_cnp?: string | null;
          parent_id_number?: string | null;
          parent_id_series?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parents_marital_status?: string | null;
          phone?: string | null;
          referral_source?: string | null;
          referred_by_name?: string | null;
          report_frequency?: string | null;
          scheduled_anonymization_at?: string | null;
          send_report_to_parent?: boolean | null;
          session_frequency?: string | null;
          session_price?: number | null;
          therapist_id?: string | null;
          terms_consent_signed_at?: string | null;
        };
        Update: {
          address?: string | null;
          billing_type?: string | null;
          client_id_number?: string | null;
          client_id_series?: string | null;
          cnp_cif?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          company_bank?: string | null;
          company_iban?: string | null;
          company_reg_com?: string | null;
          company_representative_email?: string | null;
          company_representative_name?: string | null;
          company_representative_role?: string | null;
          contract_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          email?: string | null;
          full_name?: string | null;
          gdpr_consent_signed?: boolean;
          id?: string;
          is_minor?: boolean | null;
          legal_liability_consent_signed_at?: string | null;
          location?: string | null;
          minor_cnp?: string | null;
          needs_legal_review?: boolean | null;
          notes_anonymized_at?: string | null;
          onboarding_completed_at?: string | null;
          parent_1_email?: string | null;
          parent_1_name?: string | null;
          parent_1_phone?: string | null;
          parent_2_email?: string | null;
          parent_2_name?: string | null;
          parent_2_phone?: string | null;
          parent_address?: string | null;
          parent_cnp?: string | null;
          parent_id_number?: string | null;
          parent_id_series?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parents_marital_status?: string | null;
          phone?: string | null;
          referral_source?: string | null;
          referred_by_name?: string | null;
          report_frequency?: string | null;
          scheduled_anonymization_at?: string | null;
          send_report_to_parent?: boolean | null;
          session_frequency?: string | null;
          session_price?: number | null;
          therapist_id?: string | null;
          terms_consent_signed_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          document_type: string | null;
          drive_file_id: string;
          drive_link: string | null;
          file_name: string;
          id: string;
          therapist_id: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          document_type?: string | null;
          drive_file_id: string;
          drive_link?: string | null;
          file_name: string;
          id?: string;
          therapist_id?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          document_type?: string | null;
          drive_file_id?: string;
          drive_link?: string | null;
          file_name?: string;
          id?: string;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount: number | null;
          appointment_id: string | null;
          client_name: string | null;
          id: string;
          issued_at: string;
          payment_link: string | null;
          pdf_url: string | null;
          smartbill_id: string | null;
          smartbill_number: string | null;
          smartbill_series: string | null;
          status: string;
          therapist_id: string | null;
        };
        Insert: {
          amount?: number | null;
          appointment_id?: string | null;
          client_name?: string | null;
          id?: string;
          issued_at?: string;
          payment_link?: string | null;
          pdf_url?: string | null;
          smartbill_id?: string | null;
          smartbill_number?: string | null;
          smartbill_series?: string | null;
          status?: string;
          therapist_id?: string | null;
        };
        Update: {
          amount?: number | null;
          appointment_id?: string | null;
          client_name?: string | null;
          id?: string;
          issued_at?: string;
          payment_link?: string | null;
          pdf_url?: string | null;
          smartbill_id?: string | null;
          smartbill_number?: string | null;
          smartbill_series?: string | null;
          status?: string;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          appointment_id: string;
          created_at: string;
          encrypted_content: string | null;
          id: string;
          therapist_id: string | null;
          updated_at: string;
        };
        Insert: {
          appointment_id: string;
          created_at?: string;
          encrypted_content?: string | null;
          id?: string;
          therapist_id?: string | null;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string;
          created_at?: string;
          encrypted_content?: string | null;
          id?: string;
          therapist_id?: string | null;
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
      onboarding_tokens: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          revoked_at: string | null;
          therapist_id: string;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          revoked_at?: string | null;
          therapist_id: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          therapist_id?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      generated_contracts: {
        Row: {
          client_id: string;
          contract_number: string;
          contract_year: number;
          document_url: string | null;
          drive_file_id: string | null;
          generated_at: string;
          id: string;
          patient_document_id: string | null;
          sequence_number: number;
          template_type: string;
          therapist_id: string;
        };
        Insert: {
          client_id: string;
          contract_number: string;
          contract_year: number;
          document_url?: string | null;
          drive_file_id?: string | null;
          generated_at?: string;
          id?: string;
          patient_document_id?: string | null;
          sequence_number: number;
          template_type: string;
          therapist_id: string;
        };
        Update: {
          client_id?: string;
          contract_number?: string;
          contract_year?: number;
          document_url?: string | null;
          drive_file_id?: string | null;
          generated_at?: string;
          id?: string;
          patient_document_id?: string | null;
          sequence_number?: number;
          template_type?: string;
          therapist_id?: string;
        };
        Relationships: [];
      };
      patient_documents: {
        Row: {
          client_id: string | null;
          document_type: string;
          document_url: string | null;
          drive_file_id: string | null;
          file_name: string;
          file_size_kb: number | null;
          id: string;
          mime_type: string | null;
          notes: string | null;
          storage_path: string | null;
          therapist_id: string | null;
          uploaded_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          document_type?: string;
          document_url?: string | null;
          drive_file_id?: string | null;
          file_name: string;
          file_size_kb?: number | null;
          id?: string;
          mime_type?: string | null;
          notes?: string | null;
          storage_path?: string | null;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          document_type?: string;
          document_url?: string | null;
          drive_file_id?: string | null;
          file_name?: string;
          file_size_kb?: number | null;
          id?: string;
          mime_type?: string | null;
          notes?: string | null;
          storage_path?: string | null;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      patient_medication: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          dosage: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          medication_name: string;
          prescribing_doctor: string | null;
          side_effect_notes: string | null;
          start_date: string | null;
          therapist_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          dosage?: string | null;
          end_date?: string | null;
          id?: string;
          medication_name: string;
          prescribing_doctor?: string | null;
          side_effect_notes?: string | null;
          start_date?: string | null;
          therapist_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          dosage?: string | null;
          end_date?: string | null;
          id?: string;
          medication_name?: string;
          prescribing_doctor?: string | null;
          side_effect_notes?: string | null;
          start_date?: string | null;
          therapist_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      psychological_tests: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          questions: Json | null;
          scoring_logic: Json | null;
          therapist_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          questions?: Json | null;
          scoring_logic?: Json | null;
          therapist_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          questions?: Json | null;
          scoring_logic?: Json | null;
          therapist_id?: string | null;
        };
        Relationships: [];
      };
      public_request_rate_limits: {
        Row: {
          action: string;
          bucket_key: string;
          created_at: string;
          hits: number;
          updated_at: string;
          window_expires_at: string;
          window_started_at: string;
        };
        Insert: {
          action: string;
          bucket_key: string;
          created_at?: string;
          hits?: number;
          updated_at?: string;
          window_expires_at: string;
          window_started_at?: string;
        };
        Update: {
          action?: string;
          bucket_key?: string;
          created_at?: string;
          hits?: number;
          updated_at?: string;
          window_expires_at?: string;
          window_started_at?: string;
        };
        Relationships: [];
      };
      referral_documents: {
        Row: {
          appointment_id: string | null;
          client_id: string | null;
          diagnosis_code_cim10: string | null;
          document_url: string | null;
          drive_file_id: string | null;
          file_name: string;
          file_size_kb: number | null;
          id: string;
          mime_type: string | null;
          referring_doctor_code: string | null;
          referral_date: string | null;
          referral_number: string | null;
          storage_path: string | null;
          therapist_id: string | null;
          uploaded_at: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          client_id?: string | null;
          diagnosis_code_cim10?: string | null;
          document_url?: string | null;
          drive_file_id?: string | null;
          file_name: string;
          file_size_kb?: number | null;
          id?: string;
          mime_type?: string | null;
          referring_doctor_code?: string | null;
          referral_date?: string | null;
          referral_number?: string | null;
          storage_path?: string | null;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          client_id?: string | null;
          diagnosis_code_cim10?: string | null;
          document_url?: string | null;
          drive_file_id?: string | null;
          file_name?: string;
          file_size_kb?: number | null;
          id?: string;
          mime_type?: string | null;
          referring_doctor_code?: string | null;
          referral_date?: string | null;
          referral_number?: string | null;
          storage_path?: string | null;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      therapist_documents: {
        Row: {
          category: string;
          expiry_date: string | null;
          file_path: string | null;
          file_url: string;
          id: string;
          name: string;
          therapist_id: string | null;
          uploaded_at: string | null;
        };
        Insert: {
          category: string;
          expiry_date?: string | null;
          file_path?: string | null;
          file_url: string;
          id?: string;
          name: string;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Update: {
          category?: string;
          expiry_date?: string | null;
          file_path?: string | null;
          file_url?: string;
          id?: string;
          name?: string;
          therapist_id?: string | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      therapist_settings: {
        Row: {
          cas_active: boolean | null;
          cas_contract_number: string | null;
          cas_county: string | null;
          cif: string | null;
          clinical_notes_pin_hash: string | null;
          cpr_code: string | null;
          currency: string | null;
          default_session_duration_minutes: number | null;
          default_session_price: number | null;
          full_name: string | null;
          google_access_token: string | null;
          google_calendar_channel_id: string | null;
          google_calendar_resource_id: string | null;
          google_refresh_token: string | null;
          google_token_expires_at: string | null;
          iban: string | null;
          practice_address: string | null;
          practice_caen: string | null;
          practice_email: string | null;
          practice_name: string | null;
          practice_phone: string | null;
          public_booking_enabled: boolean | null;
          public_booking_slug: string | null;
          session_types_pricing: Json | null;
          smartbill_cif: string | null;
          smartbill_token: string | null;
          smartbill_username: string | null;
          therapist_id: string;
          twilio_account_sid: string | null;
          twilio_auth_token: string | null;
          twilio_phone_number: string | null;
          updated_at: string | null;
          work_schedule: Json | null;
        };
        Insert: {
          cas_active?: boolean | null;
          cas_contract_number?: string | null;
          cas_county?: string | null;
          cif?: string | null;
          clinical_notes_pin_hash?: string | null;
          cpr_code?: string | null;
          currency?: string | null;
          default_session_duration_minutes?: number | null;
          default_session_price?: number | null;
          full_name?: string | null;
          google_access_token?: string | null;
          google_calendar_channel_id?: string | null;
          google_calendar_resource_id?: string | null;
          google_refresh_token?: string | null;
          google_token_expires_at?: string | null;
          iban?: string | null;
          practice_address?: string | null;
          practice_caen?: string | null;
          practice_email?: string | null;
          practice_name?: string | null;
          practice_phone?: string | null;
          public_booking_enabled?: boolean | null;
          public_booking_slug?: string | null;
          session_types_pricing?: Json | null;
          smartbill_cif?: string | null;
          smartbill_token?: string | null;
          smartbill_username?: string | null;
          therapist_id: string;
          twilio_account_sid?: string | null;
          twilio_auth_token?: string | null;
          twilio_phone_number?: string | null;
          updated_at?: string | null;
          work_schedule?: Json | null;
        };
        Update: {
          cas_active?: boolean | null;
          cas_contract_number?: string | null;
          cas_county?: string | null;
          cif?: string | null;
          clinical_notes_pin_hash?: string | null;
          cpr_code?: string | null;
          currency?: string | null;
          default_session_duration_minutes?: number | null;
          default_session_price?: number | null;
          full_name?: string | null;
          google_access_token?: string | null;
          google_calendar_channel_id?: string | null;
          google_calendar_resource_id?: string | null;
          google_refresh_token?: string | null;
          google_token_expires_at?: string | null;
          iban?: string | null;
          practice_address?: string | null;
          practice_caen?: string | null;
          practice_email?: string | null;
          practice_name?: string | null;
          practice_phone?: string | null;
          public_booking_enabled?: boolean | null;
          public_booking_slug?: string | null;
          session_types_pricing?: Json | null;
          smartbill_cif?: string | null;
          smartbill_token?: string | null;
          smartbill_username?: string | null;
          therapist_id?: string;
          twilio_account_sid?: string | null;
          twilio_auth_token?: string | null;
          twilio_phone_number?: string | null;
          updated_at?: string | null;
          work_schedule?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: {
      issue_generated_contract_number: {
        Args: {
          p_client_id: string;
          p_template_type: string;
        };
        Returns: Database["public"]["Tables"]["generated_contracts"]["Row"];
      };
    };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};
