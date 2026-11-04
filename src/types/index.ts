/**
 * DPDPA Privacy Compliance Suite - Types & Schemas
 * Product Requirements Document v1.0, March 2026
 */

export type ToolModuleType =
  | 'consent_manager'
  | 'data_discovery'
  | 'data_mapper'
  | 'flow_mapper'
  | 'rights_manager'
  | 'vendor_manager'
  | 'policy_generator'
  | 'dpia'
  | 'risk_register'
  | 'automation'
  | 'breach_manager'
  | 'cpo_dashboard';

export type UserRoleType = 'viewer' | 'editor' | 'approver' | 'admin' | 'ppoc_cpo';

export interface Organisation {
  id: string;
  legal_name: string;
  dba_name: string;
  cin: string;
  pan: string;
  industry: string;
  jurisdiction: string;
  timezone: string;
  dpo_name: string;
  dpo_email: string;
  dpo_phone: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  is_significant_data_fiduciary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolEntitlement {
  id: string;
  tenant_id: string;
  tool_id: ToolModuleType;
  is_licensed: boolean;
  tier: string;
  valid_until?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRoleType;
  mfa_enrolled: boolean;
  step_up_verified_at?: string;
}

export type LawfulBasisType =
  | 'consent'
  | 'certain_legitimate_uses_employment'
  | 'certain_legitimate_uses_legal_obligation'
  | 'certain_legitimate_uses_medical_emergency'
  | 'certain_legitimate_uses_public_interest'
  | 'statutory_compliance';

export interface ProcessingPurpose {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string;
  lawful_basis: LawfulBasisType;
  lawful_basis_details: string;
  is_mandatory: boolean;
  retention_period_months: number;
  is_active: boolean;
  created_at: string;
}

export interface DataPrincipal {
  id: string;
  tenant_id: string;
  external_ref: string;
  full_name: string;
  phone_masked: string;
  email_masked: string;
  category: 'customer' | 'employee' | 'job_applicant' | 'minor' | 'vendor_personnel';
  is_minor: boolean;
  guardian_name?: string;
  guardian_ref?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  name: string;
  department: string;
  owner_name: string;
  asset_type: 'relational_db' | 'nosql_db' | 'cloud_bucket' | 'file_share' | 'saas_application' | 'internal_api' | 'physical_archive';
  system_name: string;
  data_categories: string[];
  principal_categories: string[];
  hosting_geography: string;
  is_cross_border: boolean;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  status: 'active' | 'in_discovery' | 'deprecated';
  verified_at?: string;
  created_at: string;
}

export interface LegacyDataItem {
  id: string;
  tenant_id: string;
  title: string;
  system_name: string;
  estimated_volume: string;
  data_categories: string[];
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  remediation_status: 'identified' | 'under_review' | 'purge_scheduled' | 'remediated';
  remediation_owner: string;
  target_remediation_date: string;
  created_at: string;
}

export interface RoPARecord {
  id: string;
  tenant_id: string;
  purpose_id?: string;
  purpose_name: string;
  lawful_basis: LawfulBasisType;
  data_categories: string[];
  principal_categories: string[];
  linked_asset_ids: string[];
  manual_asset_refs: string[];
  processor_names: string[];
  retention_rationale: string;
  safeguards: string;
  approval_status: 'draft' | 'under_review' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  version: number;
  created_at: string;
}

export interface DataFlow {
  id: string;
  tenant_id: string;
  name: string;
  source_entity: string;
  destination_entity: string;
  direction: 'internal_to_external' | 'external_to_internal' | 'internal_cross_system';
  data_categories: string[];
  purpose_name: string;
  transfer_mechanism: string;
  destination_geography: string;
  is_cross_border: boolean;
  safeguards: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  legal_name: string;
  contact_email: string;
  services_provided: string;
  onboarding_stage: 'registration' | 'assessment' | 'dpa_workflow' | 'review' | 'approved';
  dpa_status: 'missing' | 'draft' | 'signed' | 'expired';
  dpa_signed_at?: string;
  dpa_expires_at?: string;
  risk_tier: 'tier_1_high' | 'tier_2_medium' | 'tier_3_low';
  subprocessors: string[];
  hosting_geography: string;
  security_score: number;
  created_at: string;
}

export interface PrivacyNotice {
  id: string;
  tenant_id: string;
  notice_type: 'consent' | 'general_privacy' | 'employee' | 'cctv_surveillance';
  title: string;
  version: string;
  language: string;
  content_html: string;
  content_diff?: string;
  is_active: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  tenant_id: string;
  principal_id: string;
  principal_name?: string;
  notice_id: string;
  notice_version: string;
  notice_snapshot_hash: string;
  notice_snapshot_text: string;
  purpose_id: string;
  purpose_name: string;
  consent_state: 'active' | 'withdrawn' | 'expired';
  collection_channel: string;
  ip_address_masked: string;
  user_agent_masked: string;
  receipt_token: string;
  granted_at: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;
}

export interface ParentalVerification {
  id: string;
  tenant_id: string;
  consent_id: string;
  minor_principal_id: string;
  guardian_name: string;
  guardian_id_type: string;
  verification_token: string;
  verified_at: string;
  status: 'verified' | 'pending' | 'rejected';
}

export type RightsRequestType =
  | 'access_info'
  | 'correction_update'
  | 'erasure'
  | 'grievance'
  | 'nomination';

export interface RightsRequest {
  id: string;
  tenant_id: string;
  reference_no: string;
  principal_id?: string;
  principal_name: string;
  principal_contact: string;
  request_type: RightsRequestType;
  details: string;
  status: 'received' | 'identity_verified' | 'in_progress' | 'legal_review' | 'fulfilled' | 'rejected' | 'closed';
  priority: 'urgent' | 'high' | 'standard';
  assigned_to?: string;
  submitted_at: string;
  statutory_deadline: string;
  internal_sla_deadline: string;
  rule_version_id: string;
  outcome_summary?: string;
  retention_exception_reason?: string;
  is_legal_hold: boolean;
  evidence_doc_count: number;
  closed_at?: string;
}

export interface DPIARecord {
  id: string;
  tenant_id: string;
  title: string;
  project_scope: string;
  screening_outcome: 'dpia_required' | 'exempt_low_risk' | 'exempt_standard_op';
  processing_context: string;
  necessity_rationale: string;
  residual_risk_level: 'high' | 'medium' | 'low';
  status: 'screening' | 'in_review' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  version: number;
  created_at: string;
}

export interface RiskItem {
  id: string;
  tenant_id: string;
  title: string;
  source_module: string;
  source_entity_id?: string;
  deduplication_key: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  inherent_risk_score: number; // likelihood * impact (1-25)
  residual_risk_score: number;
  mitigation_plan: string;
  status: 'open' | 'mitigated' | 'accepted' | 'closed';
  owner: string;
  review_due_at?: string;
  created_at: string;
}

export interface ComplianceTask {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  task_type: 'cessation_task' | 'dpa_renewal' | 'retention_purge' | 'legal_hold_review' | 'training' | 'regulatory_filing';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date: string;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed';
  assigned_to: string;
  source_module?: string;
  source_event_id?: string;
  completion_evidence?: string;
  completed_at?: string;
  created_at: string;
}

export interface RetentionSchedule {
  id: string;
  tenant_id: string;
  data_category: string;
  legal_retention_days: number;
  legal_basis_citation: string;
  deletion_method: string;
  review_frequency_days: number;
  created_at: string;
}

export interface BreachIncident {
  id: string;
  tenant_id: string;
  reference_no: string;
  title: string;
  incident_severity: 'critical' | 'high' | 'medium' | 'low';
  detection_timestamp: string;
  containment_status: 'investigating' | 'contained' | 'remediated' | 'closed';
  affected_data_categories: string[];
  affected_principals_count: number;
  initial_dpbi_status: 'draft' | 'approved' | 'submitted';
  initial_dpbi_deadline: string;
  initial_dpbi_submitted_at?: string;
  detailed_dpbi_status: 'draft' | 'approved' | 'submitted';
  detailed_dpbi_deadline: string;
  detailed_dpbi_submitted_at?: string;
  principal_notification_status: 'not_required' | 'pending_approval' | 'sent';
  principal_notification_count: number;
  post_incident_review?: string;
  closed_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  module: string;
  entity_type: string;
  entity_id: string;
  description: string;
  old_state_json?: any;
  new_state_json?: any;
  ip_address: string;
  created_at: string;
}

export interface ComplianceEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  source_module: string;
  entity_type: string;
  entity_id: string;
  severity: 'info' | 'warning' | 'critical';
  payload_json: any;
  status: 'pending' | 'published' | 'failed';
  retry_count: number;
  error_details?: string;
  created_at: string;
  published_at?: string;
}

export interface RegulatoryRule {
  id: string;
  rule_code: string;
  instrument: string;
  section: string;
  official_source_url: string;
  trigger_event: string;
  statutory_deadline_hours: number;
  jurisdiction: string;
  status: 'verified' | 'review_required';
  commencement_date: string;
  last_reviewed_at: string;
  description: string;
}

export interface DeadlineOverride {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  original_deadline: string;
  override_deadline: string;
  actor_name: string;
  reason: string;
  created_at: string;
}

export interface CPOHealthScore {
  total_score: number;
  normalized_score: number;
  coverage_percentage: number;
  status_label: 'Optimal Compliance' | 'Acceptable Compliance' | 'Partial coverage' | 'Insufficient data';
  last_sync_timestamp: string;
  sync_lag_seconds: number;
  module_scores: Record<ToolModuleType, {
    weight: number;
    score: number;
    is_entitled: boolean;
    data_volume: number;
    issues_count: number;
  }>;
}

export interface BoardReadinessReport {
  generated_at: string;
  tenant_name: string;
  cin: string;
  timezone: string;
  period: string;
  overall_health_score: number;
  health_status_label: string;
  sections: {
    section_number: number;
    title: string;
    prd_reference: string;
    status: 'compliant' | 'requires_attention' | 'action_required' | 'unlicensed';
    summary: string;
    metrics: Record<string, any>;
    key_findings: string[];
    recommendations: string[];
  }[];
}
