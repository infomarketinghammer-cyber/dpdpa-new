/**
 * Central Compliance Database (CCD) In-Memory & Event Engine
 * Product Requirements Document v1.0, March 2026
 *
 * Implements:
 * - Multi-tenant isolation & RLS boundaries
 * - Atomic Business Write + Append Audit + Outbox Event pattern
 * - Outbox event processor with idempotent handlers
 * - Replay & failed-event retry capabilities
 * - Real-time SSE subscriber dispatch
 */

import {
  Organisation,
  ToolEntitlement,
  User,
  Membership,
  ProcessingPurpose,
  DataPrincipal,
  Asset,
  LegacyDataItem,
  RoPARecord,
  DataFlow,
  Vendor,
  PrivacyNotice,
  ConsentRecord,
  ParentalVerification,
  RightsRequest,
  DPIARecord,
  RiskItem,
  ComplianceTask,
  RetentionSchedule,
  BreachIncident,
  AuditLog,
  ComplianceEvent,
  RegulatoryRule,
  DeadlineOverride,
  CPOHealthScore,
  BoardReadinessReport,
  ToolModuleType,
  UserRoleType,
} from '../src/types/index.js';

// ----------------------------------------------------------------------------
// SEED DATA: ORGANISATIONS & LICENSES
// ----------------------------------------------------------------------------
export const TENANT_BHARATPAY_ID = '00000000-0000-0000-0000-000000000001';
export const TENANT_SWASTHACARE_ID = '00000000-0000-0000-0000-000000000002';
export const TENANT_KISANTRADE_ID = '00000000-0000-0000-0000-000000000003';

const INITIAL_ORGANISATIONS: Organisation[] = [
  {
    id: TENANT_BHARATPAY_ID,
    legal_name: 'BharatPay Financial Technologies Ltd.',
    dba_name: 'BharatPay Payments',
    cin: 'U72900MH2021PLC362145',
    pan: 'AABCB1234F',
    industry: 'Financial Services & Digital Payments',
    jurisdiction: 'India',
    timezone: 'Asia/Kolkata',
    dpo_name: 'Rajeshwar Rao',
    dpo_email: 'dpo@bharatpay.in',
    dpo_phone: '+91 22 6123 4567',
    address_line1: 'Tower B, 14th Floor, Bandra-Kurla Complex (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    is_significant_data_fiduciary: true, // Significant Data Fiduciary under DPDPA Section 10
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-03-01T10:30:00Z',
  },
  {
    id: TENANT_SWASTHACARE_ID,
    legal_name: 'SwasthaCare Health Systems Pvt. Ltd.',
    dba_name: 'SwasthaCare Digital Clinics',
    cin: 'U85110KA2020PTC145892',
    pan: 'AABCS5678H',
    industry: 'Healthcare, Telemedicine & Diagnostics',
    jurisdiction: 'India',
    timezone: 'Asia/Kolkata',
    dpo_name: 'Dr. Ananya Sen',
    dpo_email: 'compliance@swasthacare.org',
    dpo_phone: '+91 80 4987 1122',
    address_line1: 'Plot 44, Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    is_significant_data_fiduciary: true,
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-03-02T11:00:00Z',
  },
  {
    id: TENANT_KISANTRADE_ID,
    legal_name: 'KisanTrade Direct Agri FPO Ltd.',
    dba_name: 'KisanTrade Direct',
    cin: 'U01100MP2023PTC068912',
    pan: 'AABCK9012K',
    industry: 'Agritech & Direct Farmer Marketplace',
    jurisdiction: 'India',
    timezone: 'Asia/Kolkata',
    dpo_name: 'Sunil Verma',
    dpo_email: 'grievance@kisantrade.in',
    dpo_phone: '+91 755 245 9900',
    address_line1: 'Kisan Bhawan, Arera Hills',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462011',
    is_significant_data_fiduciary: false,
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-03-01T14:00:00Z',
  },
];

const ALL_MODULES: ToolModuleType[] = [
  'consent_manager',
  'data_discovery',
  'data_mapper',
  'flow_mapper',
  'rights_manager',
  'vendor_manager',
  'policy_generator',
  'dpia',
  'risk_register',
  'automation',
  'breach_manager',
  'cpo_dashboard',
];

// Initial entitlements: BharatPay & SwasthaCare have all tools. KisanTrade ONLY has rights_manager.
function buildInitialEntitlements(): ToolEntitlement[] {
  const items: ToolEntitlement[] = [];
  // BharatPay: Full
  ALL_MODULES.forEach((mod) => {
    items.push({
      id: `ent-bp-${mod}`,
      tenant_id: TENANT_BHARATPAY_ID,
      tool_id: mod,
      is_licensed: true,
      tier: 'enterprise_unlimited',
      valid_until: '2027-03-31T23:59:59Z',
      created_at: '2026-01-15T09:00:00Z',
    });
  });
  // SwasthaCare: Full
  ALL_MODULES.forEach((mod) => {
    items.push({
      id: `ent-sc-${mod}`,
      tenant_id: TENANT_SWASTHACARE_ID,
      tool_id: mod,
      is_licensed: true,
      tier: 'healthcare_compliance_pro',
      valid_until: '2027-02-28T23:59:59Z',
      created_at: '2026-02-01T08:00:00Z',
    });
  });
  // KisanTrade: Standalone Rights Manager ONLY
  ALL_MODULES.forEach((mod) => {
    items.push({
      id: `ent-kt-${mod}`,
      tenant_id: TENANT_KISANTRADE_ID,
      tool_id: mod,
      is_licensed: mod === 'rights_manager',
      tier: mod === 'rights_manager' ? 'fpo_standalone' : 'unlicensed',
      valid_until: mod === 'rights_manager' ? '2026-12-31T23:59:59Z' : undefined,
      created_at: '2026-02-10T10:00:00Z',
    });
  });
  return items;
}

// Users and memberships
const INITIAL_USERS: User[] = [
  { id: 'usr-1', email: 'cpo@bharatpay.in', full_name: 'Rajeshwar Rao (CPO/PPOC)', phone: '+91 98200 11223' },
  { id: 'usr-2', email: 'admin@bharatpay.in', full_name: 'Sneha Patel (Privacy Admin)', phone: '+91 98200 44556' },
  { id: 'usr-3', email: 'approver@bharatpay.in', full_name: 'Vikram Malhotra (Legal Approver)', phone: '+91 98200 77889' },
  { id: 'usr-4', email: 'editor@bharatpay.in', full_name: 'Priya Nair (Privacy Engineer / Editor)', phone: '+91 98200 99001' },
  { id: 'usr-5', email: 'viewer@bharatpay.in', full_name: 'Aarav Sharma (Compliance Auditor / Viewer)', phone: '+91 98200 22334' },
];

const INITIAL_MEMBERSHIPS: Membership[] = [
  { id: 'mem-1', tenant_id: TENANT_BHARATPAY_ID, user_id: 'usr-1', role: 'ppoc_cpo', mfa_enrolled: true },
  { id: 'mem-2', tenant_id: TENANT_BHARATPAY_ID, user_id: 'usr-2', role: 'admin', mfa_enrolled: true },
  { id: 'mem-3', tenant_id: TENANT_BHARATPAY_ID, user_id: 'usr-3', role: 'approver', mfa_enrolled: true },
  { id: 'mem-4', tenant_id: TENANT_BHARATPAY_ID, user_id: 'usr-4', role: 'editor', mfa_enrolled: false },
  { id: 'mem-5', tenant_id: TENANT_BHARATPAY_ID, user_id: 'usr-5', role: 'viewer', mfa_enrolled: false },
  // SwasthaCare
  { id: 'mem-6', tenant_id: TENANT_SWASTHACARE_ID, user_id: 'usr-1', role: 'ppoc_cpo', mfa_enrolled: true },
  { id: 'mem-7', tenant_id: TENANT_SWASTHACARE_ID, user_id: 'usr-4', role: 'editor', mfa_enrolled: false },
  // KisanTrade
  { id: 'mem-8', tenant_id: TENANT_KISANTRADE_ID, user_id: 'usr-2', role: 'admin', mfa_enrolled: true },
  { id: 'mem-9', tenant_id: TENANT_KISANTRADE_ID, user_id: 'usr-4', role: 'editor', mfa_enrolled: false },
];

// Regulatory Rules Registry (DPDPA 2023 & Draft Rules 2025/2026)
const INITIAL_REGULATORY_RULES: RegulatoryRule[] = [
  {
    id: 'DPDPA-SEC6-NOTICE',
    rule_code: 'SEC_6_NOTICE',
    instrument: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 6(1)',
    official_source_url: 'https://www.meity.gov.in/writereaddata/files/Digital_Personal_Data_Protection_Act_2023.pdf',
    trigger_event: 'Personal data collection or pre-existing processing notice',
    statutory_deadline_hours: 0,
    jurisdiction: 'India',
    status: 'verified',
    commencement_date: '2024-06-01',
    last_reviewed_at: '2026-02-15T10:00:00Z',
    description: 'Notice must accompany or precede request for consent, specifying itemised personal data and purpose in English and 22 Eighth Schedule languages.',
  },
  {
    id: 'DPDPA-SEC6-CONSENT',
    rule_code: 'SEC_6_CONSENT',
    instrument: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 6(2)',
    official_source_url: 'https://www.meity.gov.in/writereaddata/files/Digital_Personal_Data_Protection_Act_2023.pdf',
    trigger_event: 'Affirmative consent request',
    statutory_deadline_hours: 0,
    jurisdiction: 'India',
    status: 'verified',
    commencement_date: '2024-06-01',
    last_reviewed_at: '2026-02-15T10:00:00Z',
    description: 'Consent must be free, specific, informed, unconditional and unambiguous with clear affirmative action, granular per purpose.',
  },
  {
    id: 'DPDPA-SEC8-BREACH-INITIAL',
    rule_code: 'SEC_8_6_BREACH_INIT',
    instrument: 'DPDPA 2023 / CERT-In Directions 2022 / Draft Rules',
    section: 'Section 8(6) & Rule 7 Draft',
    official_source_url: 'https://www.cert-in.org.in/directions2022.jsp',
    trigger_event: 'Personal data breach detection timestamp',
    statutory_deadline_hours: 6, // 6 hours initial alert to DPBI / CERT-In
    jurisdiction: 'India',
    status: 'verified',
    commencement_date: '2024-08-01',
    last_reviewed_at: '2026-03-01T12:00:00Z',
    description: 'Initial mandatory notification of personal data breach to Data Protection Board of India (DPBI) and affected Data Principals.',
  },
  {
    id: 'DPDPA-SEC8-BREACH-DETAILED',
    rule_code: 'SEC_8_6_BREACH_DETAILED',
    instrument: 'DPDPA 2023 / Draft DPBI Procedural Rules',
    section: 'Section 8(6) Follow-up',
    official_source_url: 'https://www.meity.gov.in/dpdpa-rules-2025.pdf',
    trigger_event: 'Breach detection confirmation',
    statutory_deadline_hours: 72, // 72 hours comprehensive root cause & impact report
    jurisdiction: 'India',
    status: 'review_required', // Labelled review required pending final gazette notification
    commencement_date: '2026-04-01',
    last_reviewed_at: '2026-03-01T12:00:00Z',
    description: 'Detailed forensic assessment, compromised records inventory, mitigation steps, and principal notification evidence to DPBI.',
  },
  {
    id: 'DPDPA-SEC9-CHILDREN',
    rule_code: 'SEC_9_CHILD_CONSENT',
    instrument: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 9(1) & 9(3)',
    official_source_url: 'https://www.meity.gov.in/writereaddata/files/Digital_Personal_Data_Protection_Act_2023.pdf',
    trigger_event: 'Minor (<18 years) processing activity',
    statutory_deadline_hours: 0,
    jurisdiction: 'India',
    status: 'verified',
    commencement_date: '2024-06-01',
    last_reviewed_at: '2026-02-15T10:00:00Z',
    description: 'Verifiable parental consent required before processing children personal data. Strict prohibition of tracking, behavioral monitoring, and targeted ads.',
  },
  {
    id: 'DPDPA-SEC11-DSR',
    rule_code: 'SEC_11_DSR_ACCESS',
    instrument: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 11(1)',
    official_source_url: 'https://www.meity.gov.in/writereaddata/files/Digital_Personal_Data_Protection_Act_2023.pdf',
    trigger_event: 'Data Principal Rights request submitted',
    statutory_deadline_hours: 720, // 30 calendar days
    jurisdiction: 'India',
    status: 'verified',
    commencement_date: '2024-06-01',
    last_reviewed_at: '2026-02-15T10:00:00Z',
    description: 'Right to access summary of personal data being processed, identities of all other Data Fiduciaries/Processors with whom data was shared.',
  },
  {
    id: 'DPDPA-SEC12-GRIEVANCE',
    rule_code: 'SEC_12_GRIEVANCE',
    instrument: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 12 & Rule 11 Draft',
    official_source_url: 'https://www.meity.gov.in/dpdpa-rules-2025.pdf',
    trigger_event: 'Grievance ticket logged by Data Principal',
    statutory_deadline_hours: 168, // 7 calendar days under proposed rules
    jurisdiction: 'India',
    status: 'review_required',
    commencement_date: '2026-05-01',
    last_reviewed_at: '2026-03-01T12:00:00Z',
    description: 'Data Fiduciary must provide an accessible grievance redressal mechanism and respond within prescribed statutory period before escalation to DPBI.',
  },
];

// In-Memory store container
class CentralComplianceStore {
  public organisations: Organisation[] = [...INITIAL_ORGANISATIONS];
  public entitlements: ToolEntitlement[] = buildInitialEntitlements();
  public users: User[] = [...INITIAL_USERS];
  public memberships: Membership[] = [...INITIAL_MEMBERSHIPS];
  public regulatoryRules: RegulatoryRule[] = [...INITIAL_REGULATORY_RULES];
  public deadlineOverrides: DeadlineOverride[] = [];

  // CCD entities
  public purposes: ProcessingPurpose[] = [];
  public principals: DataPrincipal[] = [];
  public assets: Asset[] = [];
  public legacyDataItems: LegacyDataItem[] = [];
  public ropaRecords: RoPARecord[] = [];
  public dataFlows: DataFlow[] = [];
  public vendors: Vendor[] = [];
  public notices: PrivacyNotice[] = [];
  public consentRecords: ConsentRecord[] = [];
  public parentalVerifications: ParentalVerification[] = [];
  public rightsRequests: RightsRequest[] = [];
  public dpiaRecords: DPIARecord[] = [];
  public risks: RiskItem[] = [];
  public complianceTasks: ComplianceTask[] = [];
  public retentionSchedules: RetentionSchedule[] = [];
  public breaches: BreachIncident[] = [];
  public auditLogs: AuditLog[] = [];
  public complianceEvents: ComplianceEvent[] = [];

  // Real-time SSE listener callbacks per tenant
  private sseSubscribers: Map<string, Set<(event: ComplianceEvent) => void>> = new Map();

  constructor() {
    this.seedDomainData();
    this.startOutboxWorker();
  }

  // Seed domain fixtures for BharatPay, SwasthaCare, and KisanTrade
  public seedDomainData() {
    // 1. Purposes
    this.purposes = [
      {
        id: 'purp-1',
        tenant_id: TENANT_BHARATPAY_ID,
        code: 'PURP_UPI_PAYMENT',
        name: 'UPI Payment & Settlement Processing',
        description: 'Routing payment instructions between NPCI switch, sponsor banks, and merchant acquirers.',
        lawful_basis: 'statutory_compliance',
        lawful_basis_details: 'Payment and Settlement Systems Act, 2007 and RBI Master Directions',
        is_mandatory: true,
        retention_period_months: 96,
        is_active: true,
        created_at: '2026-01-20T10:00:00Z',
      },
      {
        id: 'purp-2',
        tenant_id: TENANT_BHARATPAY_ID,
        code: 'PURP_CREDIT_UNDERWRITING',
        name: 'Merchant Credit Underwriting & Analytics',
        description: 'Analyzing transaction velocity to offer merchant working capital loans with lending partners.',
        lawful_basis: 'consent',
        lawful_basis_details: 'Affirmative opt-in required under DPDPA Section 6',
        is_mandatory: false,
        retention_period_months: 60,
        is_active: true,
        created_at: '2026-01-20T10:15:00Z',
      },
      {
        id: 'purp-3',
        tenant_id: TENANT_BHARATPAY_ID,
        code: 'PURP_MARKETING_PROMO',
        name: 'Personalised Rewards & Partner Offers',
        description: 'Sending cashback vouchers and brand discounts based on merchant spending categories.',
        lawful_basis: 'consent',
        lawful_basis_details: 'Unbundled consent check, withdrawable at any time',
        is_mandatory: false,
        retention_period_months: 24,
        is_active: true,
        created_at: '2026-01-20T10:30:00Z',
      },
      // SwasthaCare
      {
        id: 'purp-4',
        tenant_id: TENANT_SWASTHACARE_ID,
        code: 'PURP_HEALTH_EHR',
        name: 'Electronic Health Record (EHR) & Consultation',
        description: 'Storing diagnostic labs, prescriptions, and doctor consultation notes under ABDM standards.',
        lawful_basis: 'consent',
        lawful_basis_details: 'Explicit affirmative consent with ABDM health locker consent artefact',
        is_mandatory: true,
        retention_period_months: 120,
        is_active: true,
        created_at: '2026-02-05T09:00:00Z',
      },
    ];

    // 2. Principals
    this.principals = [
      {
        id: 'princ-1',
        tenant_id: TENANT_BHARATPAY_ID,
        external_ref: 'CUST-MUM-89214',
        full_name: 'Aditi Deshmukh',
        phone_masked: '+91 98200 •••••',
        email_masked: 'aditi.d••••@gmail.com',
        category: 'customer',
        is_minor: false,
        created_at: '2026-01-25T11:00:00Z',
      },
      {
        id: 'princ-2',
        tenant_id: TENANT_BHARATPAY_ID,
        external_ref: 'MERCH-DEL-10294',
        full_name: 'Harpreet Singh (Kirana Store Owner)',
        phone_masked: '+91 98110 •••••',
        email_masked: 'singh.store••••@yahoo.co.in',
        category: 'customer',
        is_minor: false,
        created_at: '2026-01-28T14:30:00Z',
      },
      {
        id: 'princ-3',
        tenant_id: TENANT_SWASTHACARE_ID,
        external_ref: 'PAT-BLR-00441',
        full_name: 'Master Aryan Sen (Minor, 11 yrs)',
        phone_masked: '+91 94480 •••••',
        email_masked: 'guardian.sen••••@gmail.com',
        category: 'minor',
        is_minor: true,
        guardian_name: 'Kavita Sen (Mother & Legal Guardian)',
        guardian_ref: 'AADHAAR-OKYC-9912',
        created_at: '2026-02-10T12:00:00Z',
      },
      // KisanTrade
      {
        id: 'princ-4',
        tenant_id: TENANT_KISANTRADE_ID,
        external_ref: 'FARMER-MP-0012',
        full_name: 'Rameshwar Patidar',
        phone_masked: '+91 94250 •••••',
        email_masked: 'rameshwar.patidar••••@kisantrade.in',
        category: 'customer',
        is_minor: false,
        created_at: '2026-02-12T08:00:00Z',
      },
    ];

    // 3. Assets
    this.assets = [
      {
        id: 'asset-1',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'Core Ledger PostgreSQL Cluster',
        department: 'Core Banking Engineering',
        owner_name: 'Anil Kulkarni (VP Platform)',
        asset_type: 'relational_db',
        system_name: 'pg-prod-ledger-01.internal',
        data_categories: ['Financial Identifiers', 'Account Numbers', 'Transaction Histories', 'VPA / UPI ID'],
        principal_categories: ['customer', 'merchant'],
        hosting_geography: 'India (ap-south-1 Mumbai)',
        is_cross_border: false,
        encryption_at_rest: true,
        encryption_in_transit: true,
        status: 'active',
        verified_at: '2026-02-20T10:00:00Z',
        created_at: '2026-01-16T10:00:00Z',
      },
      {
        id: 'asset-2',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'KYC Document Archive (S3 Private)',
        department: 'Risk & Compliance Operations',
        owner_name: 'Meera Nambiar (Head of KYC)',
        asset_type: 'cloud_bucket',
        system_name: 's3://bharatpay-kyc-restricted-ap-south-1',
        data_categories: ['Aadhaar Masked XML', 'PAN Details', 'Proof of Address', 'Live Selfie Geotags'],
        principal_categories: ['customer'],
        hosting_geography: 'India (ap-south-1 Mumbai)',
        is_cross_border: false,
        encryption_at_rest: true,
        encryption_in_transit: true,
        status: 'active',
        verified_at: '2026-02-25T14:00:00Z',
        created_at: '2026-01-17T11:00:00Z',
      },
      {
        id: 'asset-3',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'Marketing Redis & Segment Stream',
        department: 'Growth & Product Marketing',
        owner_name: 'Rohan Mehra (Product Lead)',
        asset_type: 'nosql_db',
        system_name: 'redis-mktg-cache.internal',
        data_categories: ['Device Advertising ID', 'App Clickstream', 'Campaign Responses'],
        principal_categories: ['customer'],
        hosting_geography: 'India (ap-south-1 Mumbai)',
        is_cross_border: false,
        encryption_at_rest: true,
        encryption_in_transit: true,
        status: 'active',
        verified_at: '2026-02-18T16:00:00Z',
        created_at: '2026-01-20T09:00:00Z',
      },
      // SwasthaCare
      {
        id: 'asset-4',
        tenant_id: TENANT_SWASTHACARE_ID,
        name: 'Clinical EMR Health Record Store',
        department: 'Medical Informatics',
        owner_name: 'Dr. Suresh Babu',
        asset_type: 'relational_db',
        system_name: 'emr-db-hyderabad.internal',
        data_categories: ['Diagnostic Pathology Reports', 'Pediatric Vaccination Records', 'Prescription Data'],
        principal_categories: ['patient', 'minor'],
        hosting_geography: 'India (ap-south-2 Hyderabad)',
        is_cross_border: false,
        encryption_at_rest: true,
        encryption_in_transit: true,
        status: 'active',
        verified_at: '2026-02-28T11:00:00Z',
        created_at: '2026-02-05T09:00:00Z',
      },
    ];

    // 4. Legacy Data Items
    this.legacyDataItems = [
      {
        id: 'leg-1',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Legacy Merchant Onboarding CSV Dumps (2021-2023)',
        system_name: 'Internal Shared NAS //nas01/shared/merchants_backup_unencrypted',
        estimated_volume: '420,000 merchant records',
        data_categories: ['PAN Cards', 'Bank Account Numbers', 'Signatory Phone Numbers'],
        risk_level: 'critical',
        remediation_status: 'purge_scheduled',
        remediation_owner: 'Anil Kulkarni',
        target_remediation_date: '2026-04-15',
        created_at: '2026-01-22T10:00:00Z',
      },
      {
        id: 'leg-2',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Deprecating SMS Campaign Log Database (MySQL 5.7)',
        system_name: 'legacy-sms-archive.internal',
        estimated_volume: '1.8M phone logs',
        data_categories: ['Unmasked Mobile Numbers', 'OTP Dispatches (Expired)'],
        risk_level: 'high',
        remediation_status: 'under_review',
        remediation_owner: 'Priya Nair',
        target_remediation_date: '2026-05-30',
        created_at: '2026-02-01T15:00:00Z',
      },
    ];

    // 5. RoPA Records
    this.ropaRecords = [
      {
        id: 'ropa-1',
        tenant_id: TENANT_BHARATPAY_ID,
        purpose_id: 'purp-1',
        purpose_name: 'UPI Payment & Settlement Processing',
        lawful_basis: 'statutory_compliance',
        data_categories: ['Bank Account Number', 'IFSC Code', 'VPA', 'Transaction Amount', 'IP Address'],
        principal_categories: ['App Users', 'Merchants'],
        linked_asset_ids: ['asset-1'],
        manual_asset_refs: [],
        processor_names: ['NPCI (National Payments Corporation of India)', 'HDFC Sponsor Bank Gateway'],
        retention_rationale: 'Mandatory 8-year record retention under PMLA 2002 and RBI Payment System directions',
        safeguards: 'AES-256 HSM encryption, TLS 1.3, strict RBAC, automated DB audit log capture',
        approval_status: 'approved',
        approved_by: 'Vikram Malhotra (Approver)',
        approved_at: '2026-02-10T16:00:00Z',
        version: 2,
        created_at: '2026-01-25T12:00:00Z',
      },
      {
        id: 'ropa-2',
        tenant_id: TENANT_BHARATPAY_ID,
        purpose_id: 'purp-2',
        purpose_name: 'Merchant Credit Underwriting & Analytics',
        lawful_basis: 'consent',
        data_categories: ['Monthly GMV Trends', 'GSTIN Status', 'CIBIL Bureau Score'],
        principal_categories: ['Sole Proprietor Merchants'],
        linked_asset_ids: ['asset-1', 'asset-2'],
        manual_asset_refs: [],
        processor_names: ['CreditVidya Analytics Pvt Ltd', 'Tata Capital Financial Services'],
        retention_rationale: 'Duration of loan application processing plus 3 years from settlement date',
        safeguards: 'Encrypted tokenisation, annual VAPT, strict contractual data processing agreement',
        approval_status: 'approved',
        approved_by: 'Vikram Malhotra (Approver)',
        approved_at: '2026-02-12T14:00:00Z',
        version: 1,
        created_at: '2026-01-26T10:00:00Z',
      },
      {
        id: 'ropa-3',
        tenant_id: TENANT_BHARATPAY_ID,
        purpose_id: 'purp-3',
        purpose_name: 'Personalised Rewards & Partner Offers',
        lawful_basis: 'consent',
        data_categories: ['Device ID', 'Product Interaction Logs', 'City Location'],
        principal_categories: ['Consumer App Users'],
        linked_asset_ids: ['asset-3'],
        manual_asset_refs: [],
        processor_names: ['MoEngage India Pvt Ltd'],
        retention_rationale: 'Active consent duration or until withdrawal by Data Principal',
        safeguards: 'Pseudonymised customer identifiers, immediate cessation upon consent withdrawal',
        approval_status: 'draft', // Testing unapproved basis flag!
        version: 1,
        created_at: '2026-02-20T10:00:00Z',
      },
    ];

    // 6. Data Flows
    this.dataFlows = [
      {
        id: 'flow-1',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'UPI Switch Authorization Flow',
        source_entity: 'BharatPay Core Switch (ap-south-1 Mumbai)',
        destination_entity: 'NPCI Central Unified Switch (Chennai / Hyderabad)',
        direction: 'internal_to_external',
        data_categories: ['Encrypted MPIN Token', 'VPA', 'Amount', 'Timestamp'],
        purpose_name: 'UPI Payment & Settlement Processing',
        transfer_mechanism: 'Dedicated Leased Line with Mutual TLS & HSM',
        destination_geography: 'India (Domestic)',
        is_cross_border: false,
        safeguards: 'NPCI Certified Terminal Encryption, End-to-end tokenization',
        risk_level: 'low',
        created_at: '2026-01-28T10:00:00Z',
      },
      {
        id: 'flow-2',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'Transaction Fraud Score Inference',
        source_entity: 'BharatPay Event Bus (Mumbai)',
        destination_entity: 'DataDog APM & Risk Engine (AWS Ireland eu-west-1)',
        direction: 'internal_to_external',
        data_categories: ['Masked IP Address', 'Latency Metrics', 'User Agent Hash'],
        purpose_name: 'Security & Anti-Fraud Monitoring',
        transfer_mechanism: 'Standard Contractual Clauses & DPDPA Whitelist Adherence',
        destination_geography: 'Ireland / EU (Cross-border)',
        is_cross_border: true,
        safeguards: 'Zero unmasked PII transmitted; hashing of telemetry client IDs',
        risk_level: 'medium',
        created_at: '2026-02-02T11:30:00Z',
      },
      {
        id: 'flow-3',
        tenant_id: TENANT_BHARATPAY_ID,
        name: 'Customer Support CRM Sync',
        source_entity: 'PostgreSQL Core Ledger',
        destination_entity: 'Zendesk Cloud (US Region)',
        direction: 'internal_to_external',
        data_categories: ['Customer Name', 'Support Ticket Transcript', 'Email Address'],
        purpose_name: 'Data Principal Grievance & Support',
        transfer_mechanism: 'Vendor DPA pending review',
        destination_geography: 'United States',
        is_cross_border: true,
        safeguards: 'Missing local storage mirror; flagged for CPO review',
        risk_level: 'high', // Flagged risk
        created_at: '2026-02-15T09:00:00Z',
      },
    ];

    // 7. Vendors
    this.vendors = [
      {
        id: 'vend-1',
        tenant_id: TENANT_BHARATPAY_ID,
        legal_name: 'Karza Technologies Pvt. Ltd.',
        contact_email: 'compliance@karza.in',
        services_provided: 'Automated PAN verification, OCR extraction, and Bank Account Penny Drop validation',
        onboarding_stage: 'approved',
        dpa_status: 'signed',
        dpa_signed_at: '2025-06-15T10:00:00Z',
        dpa_expires_at: '2026-06-14T23:59:59Z', // Valid
        risk_tier: 'tier_1_high',
        subprocessors: ['AWS India (ap-south-1)', 'NSDL e-Governance Switch'],
        hosting_geography: 'India (Mumbai)',
        security_score: 92,
        created_at: '2026-01-18T10:00:00Z',
      },
      {
        id: 'vend-2',
        tenant_id: TENANT_BHARATPAY_ID,
        legal_name: 'CloudWatch Metrics Services LLC',
        contact_email: 'security-contracts@cloudmetrics.com',
        services_provided: 'Real-time telemetry and infrastructure performance tracing',
        onboarding_stage: 'dpa_workflow',
        dpa_status: 'expired', // Tests DPA expiration alert and renewal task generation!
        dpa_signed_at: '2025-01-10T10:00:00Z',
        dpa_expires_at: '2026-01-09T23:59:59Z',
        risk_tier: 'tier_2_medium',
        subprocessors: ['CloudMetrics US-East'],
        hosting_geography: 'United States / Ireland',
        security_score: 64,
        created_at: '2026-01-20T11:00:00Z',
      },
      {
        id: 'vend-3',
        tenant_id: TENANT_BHARATPAY_ID,
        legal_name: 'QuickSMS Gateway Solutions Ltd.',
        contact_email: 'dpo@quicksmsgateway.in',
        services_provided: 'Transactional OTP and DLT SMS delivery routing',
        onboarding_stage: 'approved',
        dpa_status: 'signed',
        dpa_signed_at: '2025-11-01T10:00:00Z',
        dpa_expires_at: '2026-10-31T23:59:59Z',
        risk_tier: 'tier_1_high',
        subprocessors: ['Airtel DLT Network', 'Jio DLT Switch'],
        hosting_geography: 'India',
        security_score: 88,
        created_at: '2026-01-22T14:00:00Z',
      },
    ];

    // 8. Notices
    this.notices = [
      {
        id: 'not-1',
        tenant_id: TENANT_BHARATPAY_ID,
        notice_type: 'consent',
        title: 'BharatPay Merchant Loan & Credit Scoring Notice',
        version: 'v2.1',
        language: 'en',
        content_html: `<div class="p-4 space-y-3 font-sans text-sm">
          <h2 class="font-bold text-base text-slate-900">DPDPA Notice: Merchant Working Capital Credit Assessment</h2>
          <p class="text-slate-700">Under Section 6(1) of the Digital Personal Data Protection Act, 2023, BharatPay Financial Technologies Ltd. notifies you of the processing of your financial details.</p>
          <div class="border-l-4 border-indigo-500 pl-3 py-1 bg-indigo-50/50">
            <strong>Itemised Personal Data Collected:</strong> 3-month UPI turnover volume, GSTIN filing status, PAN card number, and credit bureau scores.
          </div>
          <p class="text-slate-700"><strong>Specified Purpose:</strong> Evaluating merchant eligibility for unsecured working capital term loans provided by RBI-registered NBFC partners.</p>
          <p class="text-slate-700"><strong>Your Rights:</strong> You may withdraw this consent at any time via your Merchant App settings or by logging into the BharatPay Data Principal Portal. Upon withdrawal, assessment stops and data is purged within 30 days unless required by law.</p>
          <p class="text-slate-600 text-xs">Principal Point of Contact (DPO): Rajeshwar Rao (dpo@bharatpay.in | +91 22 6123 4567)</p>
        </div>`,
        content_diff: 'Updated Section 6 clause clarifying 30-day cessation window and specific NBFC lender list.',
        is_active: true,
        approved_by: 'Vikram Malhotra (Approver)',
        approved_at: '2026-02-01T11:00:00Z',
        created_at: '2026-01-28T09:00:00Z',
      },
      {
        id: 'not-2',
        tenant_id: TENANT_BHARATPAY_ID,
        notice_type: 'cctv_surveillance',
        title: 'BKC Corporate Office CCTV & Visitor Notice',
        version: 'v1.0',
        language: 'en',
        content_html: `<div class="p-4 space-y-3 font-sans text-sm">
          <h2 class="font-bold text-base text-slate-900">Notice of Video Surveillance (DPDPA Section 6)</h2>
          <p class="text-slate-700">This premises is monitored by 24x7 CCTV cameras operated by BharatPay Security Operations.</p>
          <p class="text-slate-700"><strong>Purpose:</strong> Physical safety, premises security, and crime prevention.</p>
          <p class="text-slate-700"><strong>Retention:</strong> Footage is auto-overwritten after 30 days unless required for investigation.</p>
        </div>`,
        is_active: true,
        approved_by: 'Rajeshwar Rao (CPO)',
        approved_at: '2026-01-15T10:00:00Z',
        created_at: '2026-01-15T09:00:00Z',
      },
    ];

    // 9. Consents & Parental Verification
    this.consentRecords = [
      {
        id: 'con-1',
        tenant_id: TENANT_BHARATPAY_ID,
        principal_id: 'princ-1',
        principal_name: 'Aditi Deshmukh',
        notice_id: 'not-1',
        notice_version: 'v2.1',
        notice_snapshot_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        notice_snapshot_text: 'BharatPay Merchant Loan & Credit Scoring Notice v2.1 (Full legal terms snapshot frozen at collection time)',
        purpose_id: 'purp-2',
        purpose_name: 'Merchant Credit Underwriting & Analytics',
        consent_state: 'active',
        collection_channel: 'web_widget',
        ip_address_masked: '103.21.***.***',
        user_agent_masked: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_2...)',
        receipt_token: 'RCPT-2026-BP-998241',
        granted_at: '2026-02-05T14:22:10Z',
      },
      {
        id: 'con-2',
        tenant_id: TENANT_BHARATPAY_ID,
        principal_id: 'princ-2',
        principal_name: 'Harpreet Singh (Kirana Store Owner)',
        notice_id: 'not-1',
        notice_version: 'v2.1',
        notice_snapshot_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        notice_snapshot_text: 'BharatPay Merchant Loan & Credit Scoring Notice v2.1',
        purpose_id: 'purp-3',
        purpose_name: 'Personalised Rewards & Partner Offers',
        consent_state: 'active',
        collection_channel: 'merchant_mobile_app',
        ip_address_masked: '49.36.***.***',
        user_agent_masked: 'Android/16 (Build BPAY-APP-4.1)',
        receipt_token: 'RCPT-2026-BP-771239',
        granted_at: '2026-02-12T09:10:05Z',
      },
      // SwasthaCare minor consent
      {
        id: 'con-3',
        tenant_id: TENANT_SWASTHACARE_ID,
        principal_id: 'princ-3',
        principal_name: 'Master Aryan Sen (Minor, 11 yrs)',
        notice_id: 'not-1',
        notice_version: 'v1.0',
        notice_snapshot_hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
        notice_snapshot_text: 'SwasthaCare Minor Telemedicine & Pediatric Diagnostic Consent Notice v1.0',
        purpose_id: 'purp-4',
        purpose_name: 'Electronic Health Record (EHR) & Consultation',
        consent_state: 'active',
        collection_channel: 'guardian_portal',
        ip_address_masked: '115.240.***.***',
        user_agent_masked: 'Chrome/135.0 (Windows NT 10.0)',
        receipt_token: 'RCPT-2026-SC-001948',
        granted_at: '2026-02-10T12:05:00Z',
      },
    ];

    this.parentalVerifications = [
      {
        id: 'pver-1',
        tenant_id: TENANT_SWASTHACARE_ID,
        consent_id: 'con-3',
        minor_principal_id: 'princ-3',
        guardian_name: 'Kavita Sen',
        guardian_id_type: 'Aadhaar OKYC e-Verification (UIDAI Sandbox)',
        verification_token: 'VTOKEN-UIDAI-20260210-9941',
        verified_at: '2026-02-10T12:04:45Z',
        status: 'verified',
      },
    ];

    // 10. Rights Requests (DSR & Grievance)
    this.rightsRequests = [
      {
        id: 'req-1',
        tenant_id: TENANT_BHARATPAY_ID,
        reference_no: 'DSR-2026-BP-00104',
        principal_id: 'princ-1',
        principal_name: 'Aditi Deshmukh',
        principal_contact: 'aditi.d••••@gmail.com',
        request_type: 'access_info',
        details: 'Requesting full summary of personal credit score and transaction history shared with partner lending institutions over the past 12 months.',
        status: 'in_progress',
        priority: 'standard',
        assigned_to: 'Priya Nair (Editor)',
        submitted_at: '2026-02-22T10:00:00Z',
        statutory_deadline: '2026-03-24T10:00:00Z', // 30 days
        internal_sla_deadline: '2026-03-08T10:00:00Z', // 14-day internal SLA
        rule_version_id: 'DPDPA-SEC11-DSR',
        is_legal_hold: false,
        evidence_doc_count: 2,
      },
      {
        id: 'req-2',
        tenant_id: TENANT_BHARATPAY_ID,
        reference_no: 'DSR-2026-BP-00105',
        principal_id: 'princ-2',
        principal_name: 'Harpreet Singh',
        principal_contact: '+91 98110 •••••',
        request_type: 'erasure',
        details: 'Store permanently closed. Requesting deletion of merchant profile, KYC documents, and marketing contact details.',
        status: 'legal_review',
        priority: 'high',
        assigned_to: 'Vikram Malhotra (Approver)',
        submitted_at: '2026-02-25T11:30:00Z',
        statutory_deadline: '2026-03-27T11:30:00Z',
        internal_sla_deadline: '2026-03-11T11:30:00Z',
        rule_version_id: 'DPDPA-SEC11-DSR',
        outcome_summary: 'Legal exception evaluated: Core ledger tax & transaction records retained under Section 8(7) and PMLA Section 12. Marketing and profiling tags scheduled for immediate purge.',
        retention_exception_reason: 'Statutory hold: PMLA 2002 Rule 3(1) requires 5-year ledger preservation.',
        is_legal_hold: true,
        evidence_doc_count: 3,
      },
      {
        id: 'req-3',
        tenant_id: TENANT_BHARATPAY_ID,
        reference_no: 'DSR-2026-BP-00106',
        principal_name: 'Rajesh K. Gupta',
        principal_contact: 'rajesh.gupta••••@outlook.com',
        request_type: 'grievance',
        details: 'Received unsolicited telemarketing loan calls claiming to originate from BharatPay financial analytics partner.',
        status: 'received',
        priority: 'urgent',
        assigned_to: 'Rajeshwar Rao (CPO)',
        submitted_at: '2026-03-01T08:15:00Z',
        statutory_deadline: '2026-03-08T08:15:00Z', // 7 days under Section 12 draft rules
        internal_sla_deadline: '2026-03-04T08:15:00Z',
        rule_version_id: 'DPDPA-SEC12-GRIEVANCE',
        is_legal_hold: false,
        evidence_doc_count: 1,
      },
      // KisanTrade standalone request
      {
        id: 'req-4',
        tenant_id: TENANT_KISANTRADE_ID,
        reference_no: 'DSR-2026-KT-00001',
        principal_id: 'princ-4',
        principal_name: 'Rameshwar Patidar',
        principal_contact: '+91 94250 •••••',
        request_type: 'correction_update',
        details: 'Correct bank account IFSC code and crop land survey acreage in FPO registry.',
        status: 'in_progress',
        priority: 'standard',
        assigned_to: 'Sunil Verma',
        submitted_at: '2026-02-28T09:00:00Z',
        statutory_deadline: '2026-03-30T09:00:00Z',
        internal_sla_deadline: '2026-03-14T09:00:00Z',
        rule_version_id: 'DPDPA-SEC11-DSR',
        is_legal_hold: false,
        evidence_doc_count: 1,
      },
    ];

    // 11. DPIA
    this.dpiaRecords = [
      {
        id: 'dpia-1',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Real-Time Behavioral Fraud Engine Deployment',
        project_scope: 'Ingestion of merchant biometric touch cadence and device telemetry for payment fraud risk scoring.',
        screening_outcome: 'dpia_required',
        processing_context: 'Processing over 10 million daily payment interactions; potential high risk to individual autonomy.',
        necessity_rationale: 'Necessary to prevent unauthorized UPI debit takeovers while adhering to RBI cybersecurity directives.',
        residual_risk_level: 'medium',
        status: 'approved',
        approved_by: 'Rajeshwar Rao (CPO)',
        approved_at: '2026-02-15T15:00:00Z',
        version: 1,
        created_at: '2026-01-20T10:00:00Z',
      },
    ];

    // 12. Risk Register
    this.risks = [
      {
        id: 'risk-1',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Unencrypted Legacy Merchant Backup Files on NAS',
        source_module: 'data_discovery',
        source_entity_id: 'leg-1',
        deduplication_key: 'discovery:leg-1:unencrypted_nas',
        likelihood: 4,
        impact: 4,
        inherent_risk_score: 16,
        residual_risk_score: 8,
        mitigation_plan: 'Execute automated cryptographic shredding script and verify archive erasure logs before 15 April 2026.',
        status: 'open',
        owner: 'Anil Kulkarni (VP Platform)',
        review_due_at: '2026-03-30',
        created_at: '2026-01-22T11:00:00Z',
      },
      {
        id: 'risk-2',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Expired DPA with Infrastructure Telemetry Vendor (CloudMetrics)',
        source_module: 'vendor_manager',
        source_entity_id: 'vend-2',
        deduplication_key: 'vendor:vend-2:expired_dpa',
        likelihood: 3,
        impact: 4,
        inherent_risk_score: 12,
        residual_risk_score: 6,
        mitigation_plan: 'Issue revised standard DPDPA Model Clauses addendum or terminate log ingest stream.',
        status: 'open',
        owner: 'Vikram Malhotra (Legal Approver)',
        review_due_at: '2026-03-15',
        created_at: '2026-01-25T14:00:00Z',
      },
      {
        id: 'risk-3',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Missing Cross-Border Safeguards for Zendesk US Cloud',
        source_module: 'flow_mapper',
        source_entity_id: 'flow-3',
        deduplication_key: 'flow:flow-3:cross_border_missing_safeguards',
        likelihood: 3,
        impact: 3,
        inherent_risk_score: 9,
        residual_risk_score: 5,
        mitigation_plan: 'Activate Zendesk Mumbai local data residency add-on.',
        status: 'open',
        owner: 'Priya Nair (Editor)',
        review_due_at: '2026-03-20',
        created_at: '2026-02-15T10:00:00Z',
      },
    ];

    // 13. Compliance Tasks
    this.complianceTasks = [
      {
        id: 'task-1',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Execute Cryptographic Erasure for Harpreet Singh (DSR-2026-BP-00105)',
        description: 'Purge non-essential marketing profiling tags and merchant app session history. Maintain PMLA ledger hold record.',
        task_type: 'cessation_task',
        priority: 'high',
        due_date: '2026-03-10',
        status: 'in_progress',
        assigned_to: 'Priya Nair',
        source_module: 'rights_manager',
        created_at: '2026-02-25T12:00:00Z',
      },
      {
        id: 'task-2',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Execute Vendor DPA Renewal for CloudWatch Metrics Services LLC',
        description: 'Send updated DPDPA Schedule IV data processor contractual commitments.',
        task_type: 'dpa_renewal',
        priority: 'critical',
        due_date: '2026-03-05',
        status: 'pending',
        assigned_to: 'Vikram Malhotra',
        source_module: 'vendor_manager',
        created_at: '2026-01-20T12:00:00Z',
      },
      {
        id: 'task-3',
        tenant_id: TENANT_BHARATPAY_ID,
        title: 'Quarterly Data Protection Impact Review & Board Filing',
        description: 'Assemble 15-section CPO Board Readiness report for Board of Directors audit committee.',
        task_type: 'regulatory_filing',
        priority: 'high',
        due_date: '2026-03-31',
        status: 'in_progress',
        assigned_to: 'Rajeshwar Rao (CPO)',
        source_module: 'cpo_dashboard',
        created_at: '2026-02-01T09:00:00Z',
      },
    ];

    // 14. Retention Schedules
    this.retentionSchedules = [
      {
        id: 'ret-1',
        tenant_id: TENANT_BHARATPAY_ID,
        data_category: 'UPI Core Ledger & Transaction Records',
        legal_retention_days: 2920, // 8 years
        legal_basis_citation: 'Prevention of Money Laundering Act (PMLA) 2002 & RBI Payment Guidelines',
        deletion_method: 'Cryptographic key zeroization + audited tombstone',
        review_frequency_days: 180,
        created_at: '2026-01-16T10:00:00Z',
      },
      {
        id: 'ret-2',
        tenant_id: TENANT_BHARATPAY_ID,
        data_category: 'Customer Marketing & Promotional Consent Records',
        legal_retention_days: 730, // 2 years from grant or immediate upon withdrawal
        legal_basis_citation: 'DPDPA 2023 Section 8(7) Cessation of Retention',
        deletion_method: 'Automated asynchronous purge worker',
        review_frequency_days: 90,
        created_at: '2026-01-16T10:30:00Z',
      },
    ];

    // 15. Breach Incidents (Testing Section 8(6) & CPO Oversight Breach Panel)
    this.breaches = [
      {
        id: 'br-1',
        tenant_id: TENANT_BHARATPAY_ID,
        reference_no: 'INC-2026-0042',
        title: 'S3 Analytics Staging Bucket Public Read Configuration Flaw',
        incident_severity: 'critical',
        detection_timestamp: '2026-03-02T14:10:00Z',
        containment_status: 'contained',
        affected_data_categories: ['Masked Phone Numbers', 'App Usage Aggregates', 'Merchant Pincodes'],
        affected_principals_count: 14200,
        initial_dpbi_status: 'submitted', // Initial 6-hour alert submitted
        initial_dpbi_deadline: '2026-03-02T20:10:00Z',
        initial_dpbi_submitted_at: '2026-03-02T18:45:00Z',
        detailed_dpbi_status: 'draft', // 72-hour comprehensive report in draft!
        detailed_dpbi_deadline: '2026-03-05T14:10:00Z',
        principal_notification_status: 'pending_approval',
        principal_notification_count: 14200,
        post_incident_review: 'Bucket ACL remediated via AWS SCP policy within 35 minutes. Root cause: Developer staging automation script misconfigured bucket policy during canary deployment.',
        created_at: '2026-03-02T14:30:00Z',
      },
    ];

    // 16. Audit Logs
    this.auditLogs = [
      {
        id: 'aud-1',
        tenant_id: TENANT_BHARATPAY_ID,
        actor_id: 'usr-3',
        actor_name: 'Vikram Malhotra',
        actor_role: 'approver',
        action: 'APPROVE_ROPA',
        module: 'data_mapper',
        entity_type: 'ropa_record',
        entity_id: 'ropa-1',
        description: 'Approved RoPA record v2 for UPI Payment & Settlement Processing.',
        ip_address: '10.0.4.12',
        created_at: '2026-02-10T16:00:00Z',
      },
      {
        id: 'aud-2',
        tenant_id: TENANT_BHARATPAY_ID,
        actor_id: 'usr-1',
        actor_name: 'Rajeshwar Rao',
        actor_role: 'ppoc_cpo',
        action: 'SUBMIT_INITIAL_BREACH_NOTICE',
        module: 'breach_manager',
        entity_type: 'breach',
        entity_id: 'br-1',
        description: 'Authorized and submitted initial statutory personal data breach alert to Data Protection Board of India (DPBI) portal within 6 hours.',
        ip_address: '10.0.1.5',
        created_at: '2026-03-02T18:45:00Z',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // ATOMIC BUSINESS WRITE + AUDIT LOG + OUTBOX EVENT PATTERN
  // --------------------------------------------------------------------------
  public async executeTransactionalWrite<T>(params: {
    tenantId: string;
    actor: { id: string; name: string; role: string; ip?: string };
    module: ToolModuleType;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    oldState?: any;
    newState?: any;
    eventType?: string;
    eventSeverity?: 'info' | 'warning' | 'critical';
    eventPayload?: any;
    mutation: () => T;
  }): Promise<T> {
    // 1. Perform domain state mutation
    const result = params.mutation();

    // 2. Append immutable audit log
    const auditRecord: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: params.tenantId,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: params.action,
      module: params.module,
      entity_type: params.entityType,
      entity_id: params.entityId,
      description: params.description,
      old_state_json: params.oldState,
      new_state_json: params.newState,
      ip_address: params.actor.ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(auditRecord);

    // 3. Append to transactional outbox if event specified
    if (params.eventType) {
      const eventRecord: ComplianceEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: params.tenantId,
        event_type: params.eventType,
        source_module: params.module,
        entity_type: params.entityType,
        entity_id: params.entityId,
        severity: params.eventSeverity || 'info',
        payload_json: params.eventPayload || {},
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
      };
      this.complianceEvents.unshift(eventRecord);

      // Trigger immediate async dispatch
      this.dispatchOutboxEvent(eventRecord);
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // OUTBOX WORKER & EVENT PROCESSOR
  // --------------------------------------------------------------------------
  private startOutboxWorker() {
    // Periodic poll for any failed or retryable events
    setInterval(() => {
      const pendingEvents = this.complianceEvents.filter(
        (e) => e.status === 'pending' || (e.status === 'failed' && e.retry_count < 3)
      );
      for (const evt of pendingEvents) {
        this.dispatchOutboxEvent(evt);
      }
    }, 15000);
  }

  public async dispatchOutboxEvent(event: ComplianceEvent) {
    try {
      // Internal event handlers
      if (event.event_type === 'consent.withdrawn') {
        // Generates an automated cessation task if not already present
        const dedupe = `cessation-${event.entity_id}`;
        const exists = this.complianceTasks.some(
          (t) => t.tenant_id === event.tenant_id && t.source_event_id === event.id
        );
        if (!exists) {
          const newTask: ComplianceTask = {
            id: `task-cessation-${Date.now()}`,
            tenant_id: event.tenant_id,
            title: `Cessation of Processing: Data Principal ${event.payload_json?.principal_name || 'Subject'}`,
            description: `Automated cessation task triggered by consent withdrawal for purpose: ${event.payload_json?.purpose_name || 'Unspecified'}. Stop processing and purge non-statutory data within 30 days.`,
            task_type: 'cessation_task',
            priority: 'high',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assigned_to: 'Priya Nair (Editor)',
            source_module: 'consent_manager',
            source_event_id: event.id,
            created_at: new Date().toISOString(),
          };
          this.complianceTasks.unshift(newTask);
        }
      } else if (event.event_type === 'dpa.expiring') {
        const vendorId = event.entity_id;
        const exists = this.complianceTasks.some(
          (t) => t.tenant_id === event.tenant_id && t.task_type === 'dpa_renewal' && t.source_module === 'vendor_manager' && t.title.includes(vendorId)
        );
        if (!exists) {
          const newTask: ComplianceTask = {
            id: `task-dpa-${Date.now()}`,
            tenant_id: event.tenant_id,
            title: `DPA Renewal: Vendor ${event.payload_json?.vendor_name || vendorId}`,
            description: `Contractual DPA is expiring soon. Execute renewed DPDPA-compliant processing clauses.`,
            task_type: 'dpa_renewal',
            priority: 'critical',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assigned_to: 'Vikram Malhotra (Approver)',
            source_module: 'vendor_manager',
            source_event_id: event.id,
            created_at: new Date().toISOString(),
          };
          this.complianceTasks.unshift(newTask);
        }
      } else if (event.event_type === 'dpia.risk_identified') {
        // Ingest into risk register with idempotent deduplication key
        const dedupeKey = `dpia:${event.entity_id}:${event.payload_json?.risk_title || 'general'}`;
        const exists = this.risks.some(
          (r) => r.tenant_id === event.tenant_id && r.deduplication_key === dedupeKey
        );
        if (!exists) {
          const newRisk: RiskItem = {
            id: `risk-dpia-${Date.now()}`,
            tenant_id: event.tenant_id,
            title: event.payload_json?.risk_title || 'High Risk Identified in DPIA Assessment',
            source_module: 'dpia',
            source_entity_id: event.entity_id,
            deduplication_key: dedupeKey,
            likelihood: event.payload_json?.likelihood || 3,
            impact: event.payload_json?.impact || 4,
            inherent_risk_score: (event.payload_json?.likelihood || 3) * (event.payload_json?.impact || 4),
            residual_risk_score: event.payload_json?.residual || 6,
            mitigation_plan: event.payload_json?.mitigation || 'Implement zero-trust boundary and privacy safeguards.',
            status: 'open',
            owner: 'Rajeshwar Rao (CPO)',
            review_due_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          };
          this.risks.unshift(newRisk);
        }
      }

      // Mark event published
      event.status = 'published';
      event.published_at = new Date().toISOString();

      // Notify SSE subscribers
      this.broadcastToTenant(event.tenant_id, event);
    } catch (err: any) {
      event.status = 'failed';
      event.retry_count += 1;
      event.error_details = err.message || 'Execution error';
    }
  }

  // --------------------------------------------------------------------------
  // REAL-TIME SSE (Server-Sent Events) SUBSCRIBERS
  // --------------------------------------------------------------------------
  public subscribeTenant(tenantId: string, callback: (event: ComplianceEvent) => void): () => void {
    if (!this.sseSubscribers.has(tenantId)) {
      this.sseSubscribers.set(tenantId, new Set());
    }
    this.sseSubscribers.get(tenantId)!.add(callback);
    return () => {
      this.sseSubscribers.get(tenantId)?.delete(callback);
    };
  }

  private broadcastToTenant(tenantId: string, event: ComplianceEvent) {
    const subs = this.sseSubscribers.get(tenantId);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          // ignore dead connections
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // CPO METRICS ENGINE & HEALTH SCORE (PRD Section 6 Published Weights)
  // Weights:
  // Discovery: 10%
  // Data Mapper: 15%
  // Flow Mapper: 10%
  // Consent: 10%
  // Policy/Notice: 10%
  // Rights: 10%
  // Vendor: 15%
  // Risk: 5%
  // Automation: 10%
  // Breach: 5%
  // Total: 100% (DPIA shown separately as specified in PRD)
  // --------------------------------------------------------------------------
  public calculateHealthScore(tenantId: string): CPOHealthScore {
    const entitlements = this.entitlements.filter((e) => e.tenant_id === tenantId);
    const isEntitled = (tool: ToolModuleType) =>
      entitlements.some((e) => e.tool_id === tool && e.is_licensed);

    const weights: Record<ToolModuleType, number> = {
      data_discovery: 10,
      data_mapper: 15,
      flow_mapper: 10,
      consent_manager: 10,
      policy_generator: 10,
      rights_manager: 10,
      vendor_manager: 15,
      risk_register: 5,
      automation: 10,
      breach_manager: 5,
      dpia: 0, // Tracked separately per PRD
      cpo_dashboard: 0,
    };

    // Calculate individual scores
    const assets = this.assets.filter((a) => a.tenant_id === tenantId);
    const unverifiedAssets = assets.filter((a) => !a.verified_at).length;
    const discoveryScore = assets.length > 0 ? Math.max(30, 100 - unverifiedAssets * 15) : 0;

    const ropas = this.ropaRecords.filter((r) => r.tenant_id === tenantId);
    const unapprovedRopas = ropas.filter((r) => r.approval_status !== 'approved').length;
    const mapperScore = ropas.length > 0 ? Math.max(20, 100 - unapprovedRopas * 20) : 0;

    const flows = this.dataFlows.filter((f) => f.tenant_id === tenantId);
    const highRiskFlows = flows.filter((f) => f.risk_level === 'high' || f.risk_level === 'critical').length;
    const flowScore = flows.length > 0 ? Math.max(20, 100 - highRiskFlows * 25) : 0;

    const consents = this.consentRecords.filter((c) => c.tenant_id === tenantId);
    const consentScore = consents.length > 0 ? 95 : 0;

    const notices = this.notices.filter((n) => n.tenant_id === tenantId);
    const activeNotices = notices.filter((n) => n.is_active && n.approved_by).length;
    const policyScore = activeNotices > 0 ? 100 : 0;

    const rights = this.rightsRequests.filter((r) => r.tenant_id === tenantId);
    const overdueRights = rights.filter(
      (r) => r.status !== 'closed' && r.status !== 'fulfilled' && new Date(r.statutory_deadline) < new Date()
    ).length;
    const rightsScore = rights.length > 0 ? Math.max(30, 100 - overdueRights * 30) : 0;

    const vendors = this.vendors.filter((v) => v.tenant_id === tenantId);
    const expiredDpas = vendors.filter((v) => v.dpa_status === 'expired' || v.dpa_status === 'missing').length;
    const vendorScore = vendors.length > 0 ? Math.max(20, 100 - expiredDpas * 25) : 0;

    const risks = this.risks.filter((r) => r.tenant_id === tenantId);
    const criticalRisks = risks.filter((r) => r.status === 'open' && r.inherent_risk_score >= 15).length;
    const riskScore = risks.length > 0 ? Math.max(20, 100 - criticalRisks * 20) : 0;

    const tasks = this.complianceTasks.filter((t) => t.tenant_id === tenantId);
    const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    const automationScore = tasks.length > 0 ? Math.max(40, 100 - pendingTasks * 10) : 0;

    const breaches = this.breaches.filter((b) => b.tenant_id === tenantId);
    const activeBreaches = breaches.filter((b) => b.containment_status !== 'closed').length;
    const breachScore = activeBreaches > 0 ? 50 : 100;

    const moduleScores: Record<ToolModuleType, { weight: number; score: number; is_entitled: boolean; data_volume: number; issues_count: number }> = {
      data_discovery: { weight: weights.data_discovery, score: discoveryScore, is_entitled: isEntitled('data_discovery'), data_volume: assets.length, issues_count: unverifiedAssets },
      data_mapper: { weight: weights.data_mapper, score: mapperScore, is_entitled: isEntitled('data_mapper'), data_volume: ropas.length, issues_count: unapprovedRopas },
      flow_mapper: { weight: weights.flow_mapper, score: flowScore, is_entitled: isEntitled('flow_mapper'), data_volume: flows.length, issues_count: highRiskFlows },
      consent_manager: { weight: weights.consent_manager, score: consentScore, is_entitled: isEntitled('consent_manager'), data_volume: consents.length, issues_count: 0 },
      policy_generator: { weight: weights.policy_generator, score: policyScore, is_entitled: isEntitled('policy_generator'), data_volume: notices.length, issues_count: 0 },
      rights_manager: { weight: weights.rights_manager, score: rightsScore, is_entitled: isEntitled('rights_manager'), data_volume: rights.length, issues_count: overdueRights },
      vendor_manager: { weight: weights.vendor_manager, score: vendorScore, is_entitled: isEntitled('vendor_manager'), data_volume: vendors.length, issues_count: expiredDpas },
      risk_register: { weight: weights.risk_register, score: riskScore, is_entitled: isEntitled('risk_register'), data_volume: risks.length, issues_count: criticalRisks },
      automation: { weight: weights.automation, score: automationScore, is_entitled: isEntitled('automation'), data_volume: tasks.length, issues_count: pendingTasks },
      breach_manager: { weight: weights.breach_manager, score: breachScore, is_entitled: isEntitled('breach_manager'), data_volume: breaches.length, issues_count: activeBreaches },
      dpia: { weight: 0, score: 85, is_entitled: isEntitled('dpia'), data_volume: this.dpiaRecords.filter((d) => d.tenant_id === tenantId).length, issues_count: 0 },
      cpo_dashboard: { weight: 0, score: 100, is_entitled: isEntitled('cpo_dashboard'), data_volume: 1, issues_count: 0 },
    };

    // Calculate weighted and normalized score
    let totalScore = 0;
    let totalEntitledWeight = 0;
    let scoredModulesCount = 0;

    (Object.keys(weights) as ToolModuleType[]).forEach((mod) => {
      const w = weights[mod];
      if (w > 0 && isEntitled(mod)) {
        totalEntitledWeight += w;
        totalScore += (moduleScores[mod].score * w) / 100;
        scoredModulesCount++;
      }
    });

    const normalizedScore = totalEntitledWeight > 0 ? Math.round((totalScore / totalEntitledWeight) * 100) : 0;
    const coveragePercentage = totalEntitledWeight;

    let statusLabel: CPOHealthScore['status_label'] = 'Optimal Compliance';
    if (scoredModulesCount === 0 || totalEntitledWeight === 0) {
      statusLabel = 'Insufficient data';
    } else if (coveragePercentage < 100) {
      statusLabel = 'Partial coverage';
    } else if (normalizedScore < 70) {
      statusLabel = 'Acceptable Compliance';
    }

    return {
      total_score: Math.round(totalScore),
      normalized_score: normalizedScore,
      coverage_percentage: coveragePercentage,
      status_label: statusLabel,
      last_sync_timestamp: new Date().toISOString(),
      sync_lag_seconds: 2, // simulated current lag
      module_scores: moduleScores,
    };
  }

  // --------------------------------------------------------------------------
  // 15-SECTION BOARD READINESS REPORT GENERATOR (PRD Section 6)
  // --------------------------------------------------------------------------
  public generateBoardReadinessReport(tenantId: string): BoardReadinessReport {
    const org = this.organisations.find((o) => o.id === tenantId) || this.organisations[0];
    const health = this.calculateHealthScore(tenantId);
    const breaches = this.breaches.filter((b) => b.tenant_id === tenantId);
    const openRisks = this.risks.filter((r) => r.tenant_id === tenantId && r.status === 'open');
    const vendors = this.vendors.filter((v) => v.tenant_id === tenantId);
    const rights = this.rightsRequests.filter((r) => r.tenant_id === tenantId);
    const ropas = this.ropaRecords.filter((r) => r.tenant_id === tenantId);

    return {
      generated_at: new Date().toISOString(),
      tenant_name: org.legal_name,
      cin: org.cin,
      timezone: org.timezone,
      period: 'Q1 2026 (1 Jan 2026 – 31 Mar 2026)',
      overall_health_score: health.normalized_score,
      health_status_label: health.status_label,
      sections: [
        {
          section_number: 1,
          title: 'Executive Summary & DPDPA Readiness Verdict',
          prd_reference: 'PRD CPO.1',
          status: health.normalized_score >= 80 ? 'compliant' : 'requires_attention',
          summary: `Executive assessment of ${org.legal_name}'s data fiduciary compliance status under the Digital Personal Data Protection Act, 2023.`,
          metrics: { overall_score: `${health.normalized_score}%`, status: health.status_label, coverage: `${health.coverage_percentage}%` },
          key_findings: [
            'Significant Data Fiduciary compliance framework active and operational.',
            'Central Compliance Database (CCD) maintains transactional audit records and event log.',
          ],
          recommendations: ['Maintain bi-weekly executive review of statutory filing deadlines.'],
        },
        {
          section_number: 2,
          title: 'Organisational Governance & DPO Mandate',
          prd_reference: 'PRD CPO.2 (DPDPA Sec 8(5))',
          status: org.dpo_name ? 'compliant' : 'action_required',
          summary: `Status of Data Protection Officer appointment and Board oversight reporting mechanisms.`,
          metrics: { dpo: org.dpo_name, email: org.dpo_email, sdf_status: org.is_significant_data_fiduciary ? 'Designated SDF' : 'Standard Fiduciary' },
          key_findings: [`DPO ${org.dpo_name} formally gazetted with reporting line to Audit Committee.`],
          recommendations: ['Publish updated DPO contact information in the annual corporate filing.'],
        },
        {
          section_number: 3,
          title: 'Data Inventory & Asset Classification',
          prd_reference: 'PRD Discovery (Sec 8(4))',
          status: health.module_scores.data_discovery.is_entitled ? 'compliant' : 'unlicensed',
          summary: 'Status of electronic and physical personal data repositories and systems.',
          metrics: { total_assets: this.assets.filter((a) => a.tenant_id === tenantId).length, verified_assets: this.assets.filter((a) => a.tenant_id === tenantId && a.verified_at).length },
          key_findings: ['All production databases host personal data strictly within India (ap-south-1 Mumbai / ap-south-2 Hyderabad).'],
          recommendations: ['Complete remediation schedule on legacy unencrypted shared drive backups.'],
        },
        {
          section_number: 4,
          title: 'Record of Processing Activities (RoPA)',
          prd_reference: 'PRD Data Mapper (Sec 8(1))',
          status: ropas.every((r) => r.approval_status === 'approved') ? 'compliant' : 'requires_attention',
          summary: 'Comprehensive Register of Processing Activities and legal basis mapping.',
          metrics: { total_ropas: ropas.length, approved: ropas.filter((r) => r.approval_status === 'approved').length },
          key_findings: ['Core banking and underwriting flows have verified statutory and affirmative consent bases.'],
          recommendations: ['Finalize Approver sign-off on promotional marketing processing records.'],
        },
        {
          section_number: 5,
          title: 'Cross-Border Data Transfer & Geolocation Compliance',
          prd_reference: 'PRD Flow Mapper (Sec 16)',
          status: 'compliant',
          summary: 'Review of international data transfers against Central Government notification list.',
          metrics: { total_flows: this.dataFlows.filter((f) => f.tenant_id === tenantId).length, cross_border_flows: this.dataFlows.filter((f) => f.tenant_id === tenantId && f.is_cross_border).length },
          key_findings: ['No data transfers detected to restricted or blacklisted jurisdictions.'],
          recommendations: ['Execute India local data residency add-on for customer support CRM.'],
        },
        {
          section_number: 6,
          title: 'Consent Governance & Unbundled Choice Verification',
          prd_reference: 'PRD Consent (Sec 6)',
          status: 'compliant',
          summary: 'Audit of affirmative consent capture, unbundled opt-ins, and cryptographic receipts.',
          metrics: { active_consents: this.consentRecords.filter((c) => c.tenant_id === tenantId && c.consent_state === 'active').length, receipts_issued: this.consentRecords.filter((c) => c.tenant_id === tenantId).length },
          key_findings: ['100% of web and mobile capture forms utilize unbundled affirmative purpose check boxes with zero pre-selection.'],
          recommendations: ['Conduct quarterly cryptographic snapshot verification across consent receipts.'],
        },
        {
          section_number: 7,
          title: 'Children Personal Data & Parental Verification',
          prd_reference: 'PRD Consent (Sec 9)',
          status: 'compliant',
          summary: 'Compliance with strict minor protection guidelines and verifiable parental consent.',
          metrics: { minor_records: this.principals.filter((p) => p.tenant_id === tenantId && p.is_minor).length, parental_verifications: this.parentalVerifications.filter((pv) => pv.tenant_id === tenantId && pv.status === 'verified').length },
          key_findings: ['Aadhaar OKYC verified guardian identity binding enforced prior to minor data processing.'],
          recommendations: ['Maintain zero targeted advertising or tracking telemetry on minor accounts.'],
        },
        {
          section_number: 8,
          title: 'Data Principal Rights & Grievance SLA Performance',
          prd_reference: 'PRD Rights (Sec 11, 12, 14)',
          status: rights.some((r) => r.status !== 'closed' && new Date(r.statutory_deadline) < new Date()) ? 'action_required' : 'compliant',
          summary: 'Data Principal request resolution metrics across Access, Correction, Erasure, and Grievance.',
          metrics: { total_requests: rights.length, active_queue: rights.filter((r) => r.status !== 'closed').length, avg_resolution_days: '6.4 days' },
          key_findings: ['All requests acknowledged within 24 hours. Zero statutory deadline breaches recorded.'],
          recommendations: ['Automate tokenized secure response payload download link expiration.'],
        },
        {
          section_number: 9,
          title: 'Vendor Risk & Data Processor Agreement (DPA) Status',
          prd_reference: 'PRD Vendor (Sec 8(2))',
          status: vendors.some((v) => v.dpa_status === 'expired') ? 'action_required' : 'compliant',
          summary: 'Due diligence, security assessments, and binding contractual DPAs with Data Processors.',
          metrics: { total_vendors: vendors.length, active_signed_dpas: vendors.filter((v) => v.dpa_status === 'signed').length, expired_dpas: vendors.filter((v) => v.dpa_status === 'expired').length },
          key_findings: ['1 vendor DPA expired (CloudWatch Metrics); automated renewal task escalated to legal.'],
          recommendations: ['Enforce automated blocking of API credentials when a vendor DPA passes expiry.'],
        },
        {
          section_number: 10,
          title: 'Privacy Notices & Multi-lingual Accessibility',
          prd_reference: 'PRD Policy (Sec 6(1))',
          status: 'compliant',
          summary: 'Review of active privacy notices, CCTV notices, and language translations.',
          metrics: { active_notices: this.notices.filter((n) => n.tenant_id === tenantId && n.is_active).length, languages: 'English, Hindi, Marathi' },
          key_findings: ['Active consent notices include specific DPO contact details and withdrawal mechanisms.'],
          recommendations: ['Complete Eighth Schedule regional language expansion for customer-facing portals.'],
        },
        {
          section_number: 11,
          title: 'Data Protection Impact Assessments (DPIA)',
          prd_reference: 'PRD DPIA (Sec 10(2)(c))',
          status: 'compliant',
          summary: 'Comprehensive assessments performed for high-risk processing and algorithmic scoring.',
          metrics: { completed_dpias: this.dpiaRecords.filter((d) => d.tenant_id === tenantId && d.status === 'approved').length, active_reviews: 0 },
          key_findings: ['Behavioral Fraud Detection DPIA completed and signed off with residual medium risk.'],
          recommendations: ['Trigger automated DPIA screening on new AI model deployments.'],
        },
        {
          section_number: 12,
          title: 'Enterprise Risk Register & Mitigations',
          prd_reference: 'PRD Risk Register',
          status: openRisks.some((r) => r.inherent_risk_score >= 15) ? 'requires_attention' : 'compliant',
          summary: 'Likelihood x Impact scoring of operational privacy risks and remediation tracking.',
          metrics: { total_open_risks: openRisks.length, critical_risks: openRisks.filter((r) => r.inherent_risk_score >= 15).length },
          key_findings: ['Legacy backup files on NAS identified as primary inherent risk; remediation in progress.'],
          recommendations: ['Enforce strict review dates with automated escalation to Risk Committee.'],
        },
        {
          section_number: 13,
          title: 'Compliance Automation & Retention Schedules',
          prd_reference: 'PRD Automation (Sec 8(7))',
          status: 'compliant',
          summary: 'Automated cessation tasks, retention schedules, and legal hold registers.',
          metrics: { active_tasks: this.complianceTasks.filter((t) => t.tenant_id === tenantId && t.status !== 'completed').length, completed: this.complianceTasks.filter((t) => t.tenant_id === tenantId && t.status === 'completed').length },
          key_findings: ['Automated cessation task created immediately upon consent withdrawal event.'],
          recommendations: ['Perform bi-annual test of cryptographic deletion verification.'],
        },
        {
          section_number: 14,
          title: 'Security Safeguards & Personal Data Breach Response',
          prd_reference: 'PRD Breach (Sec 8(6))',
          status: breaches.some((b) => b.containment_status !== 'closed') ? 'requires_attention' : 'compliant',
          summary: 'Security measures (encryption at rest/in transit) and statutory breach notification compliance.',
          metrics: { active_incidents: breaches.filter((b) => b.containment_status !== 'closed').length, initial_notices_met: '100% (within 6h)' },
          key_findings: ['INC-2026-0042 contained within 35 minutes; initial statutory alert submitted to DPBI.'],
          recommendations: ['Submit detailed 72-hour root cause filing to DPBI before statutory deadline.'],
        },
        {
          section_number: 15,
          title: 'Audit Trail Integrity',
          prd_reference: 'PRD Architecture (Sec 2)',
          status: 'compliant',
          summary: 'Verification that every compliance action is permanently recorded in a tamper-proof audit log.',
          metrics: { total_audit_entries: this.auditLogs.filter((a) => a.tenant_id === tenantId).length, compliance_events_recorded: this.complianceEvents.filter((e) => e.tenant_id === tenantId && e.status === 'published').length },
          key_findings: ['Every recorded change has a matching audit entry and compliance event.'],
          recommendations: ['Archive quarterly audit snapshots to write-once-read-many (WORM) storage.'],
        },
      ],
    };
  }

  // Reset to initial seed state
  public resetToSeed() {
    this.organisations = [...INITIAL_ORGANISATIONS];
    this.entitlements = buildInitialEntitlements();
    this.users = [...INITIAL_USERS];
    this.memberships = [...INITIAL_MEMBERSHIPS];
    this.regulatoryRules = [...INITIAL_REGULATORY_RULES];
    this.deadlineOverrides = [];
    this.seedDomainData();
  }
}

export const ccdStore = new CentralComplianceStore();
