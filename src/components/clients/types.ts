import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type IconComponent = ComponentType<{ className?: string }>;

export interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  gdpr_consent_signed: boolean | null;
  lifecycle_status: string | null;
  lifecycle_status_updated_at: string | null;
  onboarding_completed_at: string | null;
  needs_legal_review: boolean | null;
  notes_anonymized_at: string | null;
  scheduled_anonymization_at: string | null;
  is_minor: boolean | null;
  cnp_cif: string | null;
  minor_cnp: string | null;
  parent_cnp: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_1_name: string | null;
  parent_1_phone: string | null;
  parent_1_email: string | null;
  parent_2_name: string | null;
  parent_2_phone: string | null;
  parent_2_email: string | null;
  parent_address: string | null;
  parent_id_series: string | null;
  parent_id_number: string | null;
  parents_marital_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  date_of_birth: string | null;
  client_id_series: string | null;
  client_id_number: string | null;
  terms_consent_signed_at: string | null;
  legal_liability_consent_signed_at: string | null;
  contract_url: string | null;
  location: string | null;
  billing_type: string | null;
  company_name: string | null;
  company_address: string | null;
  company_reg_com: string | null;
  company_iban: string | null;
  company_bank: string | null;
  company_representative_name: string | null;
  company_representative_email: string | null;
  company_representative_role: string | null;
  session_price: number | null;
  session_frequency: string | null;
  report_frequency: string | null;
  send_report_to_parent: boolean | null;
  referral_source: string | null;
  referred_by_name: string | null;
  service_type: string | null;
  service_track_status: string | null;
  main_complaint: string | null;
  clinical_focus: unknown[] | null;
  treatment_goals: unknown[] | null;
  treatment_plan: string | null;
  risk_level: string | null;
  research_consent: boolean | null;
}

export interface ClientAssessment {
  id: string;
  assessment_type: string;
  created_at: string;
  content_summary: string | null;
  scoring_data: Record<string, unknown>;
  sent_to_parent_at?: string | null;
}

export interface ClientStatusHistoryItem {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  changed_at: string;
  changed_by_name: string | null;
}

export interface ClientAccessHistoryItem {
  id: string;
  action: string;
  category: string;
  severity: string;
  status: string;
  actor_role: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ClientPayment {
  id: string;
  amount: number;
  status: string | null;
  issued_at: string | null;
  appointment_id: string | null;
  smartbill_series?: string | null;
  smartbill_number?: string | null;
  client_name?: string | null;
}

export interface ClientDocument {
  id: string;
  file_name: string;
  document_type?: string | null;
  document_url?: string | null;
  drive_link?: string | null;
  download_url?: string | null;
  storage_path?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
}

export interface ClientMedication {
  id: string;
  name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  prescribed_by?: string | null;
  start_date?: string | null;
}

// P2 — Clinical tools

export interface HomeworkItem {
  id: string;
  client_id: string;
  description: string;
  due_date: string | null;
  completed_at: string | null;
  therapist_notes: string | null;
  created_at: string;
}

export interface CbtCaseFormulation {
  id: string;
  client_id: string;
  presenting_problem: string | null;
  automatic_thoughts: string | null;
  cognitive_distortions: string[] | null;
  core_beliefs: string | null;
  behavioral_patterns: string | null;
  triggering_situations: string | null;
  maintenance_factors: string | null;
  strengths: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbtDiaryCard {
  id: string;
  client_id: string;
  week_start: string;
  emotion_scores: Record<string, unknown> | null;
  skills_used: string[] | null;
  target_behaviors: Array<{ name: string; count: number }> | null;
  therapist_notes: string | null;
  created_at: string;
}

export interface SafetyPlan {
  id: string;
  client_id: string;
  warning_signs: string | null;
  internal_coping: string | null;
  social_distractions: string | null;
  reasons_for_living: string | null;
  support_contacts: Array<{ name: string; phone: string; relation?: string }> | null;
  professional_contacts: Array<{ name: string; phone: string }> | null;
  safe_environment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrisisNoteItem {
  id: string;
  created_at: string;
  content?: string | null;
  summary?: string | null;
  severity?: string | null;
}

export interface ClientAppointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  meet_link?: string | null;
  location_tag?: string | null;
  notes?: Array<{ id: string }> | null;
  invoices?: Array<{ id: string }> | null;
  hasDiaryCardThisWeek?: boolean | null;
}

export interface ClientAiContext {
  name: string | null;
  isMinor: boolean;
  parentName: string | null;
  billingType: string | null;
  companyName: string | null;
  sessionFrequency: string | null;
  sessionPrice: string | null;
  totalSessions: number;
  totalAmount: number;
  gdprSigned: boolean;
  lastAssessments: Array<{
    type: string;
    date: string;
    scores: Record<string, unknown>;
  }>;
}

export interface ClientOverview {
  totalSessions: number;
  lastAppointmentDate: string | null;
  nextAppointment: {
    date: string;
    status: string | null;
  } | null;
  recentInteractions: Array<{
    id: string;
    date: string;
    status: string | null;
    summary: string;
  }>;
}

export interface WidgetCardProps {
  icon: LucideIcon;
  title: string;
  value: ReactNode;
  link: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "outline" | "success" | "warning" | "destructive";
}
