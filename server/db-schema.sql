-- ============================================================================
-- DPDPA PRIVACY COMPLIANCE SUITE: CENTRAL COMPLIANCE DATABASE (CCD) DDL
-- Product Requirements Document v1.0, March 2026
-- Target Database: PostgreSQL 15+ with Row-Level Security (RLS)
-- Default Timezone: Asia/Kolkata (IST)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TENANTS AND ORGANISATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    dba_name VARCHAR(255),
    cin VARCHAR(21) UNIQUE, -- Corporate Identification Number (MCA India)
    pan VARCHAR(10),
    industry VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(100) DEFAULT 'India',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    dpo_name VARCHAR(255),
    dpo_email VARCHAR(255),
    dpo_phone VARCHAR(50),
    address_line1 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_significant_data_fiduciary BOOLEAN DEFAULT FALSE, -- Section 10 DPDPA
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 2. TOOL ENTITLEMENTS (Licensable Modules)
-- ----------------------------------------------------------------------------
CREATE TYPE tool_module_type AS ENUM (
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
    'cpo_dashboard'
);

CREATE TABLE tool_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    tool_id tool_module_type NOT NULL,
    is_licensed BOOLEAN DEFAULT TRUE,
    tier VARCHAR(50) DEFAULT 'enterprise',
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    UNIQUE (tenant_id, tool_id)
);

-- ----------------------------------------------------------------------------
-- 3. USERS AND MEMBERSHIPS (Role-Based Access & MFA)
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM (
    'viewer',
    'editor',
    'approver',
    'admin',
    'ppoc_cpo'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'viewer',
    mfa_enrolled BOOLEAN DEFAULT FALSE,
    step_up_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    UNIQUE (tenant_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. DATA PRINCIPALS & PROCESSING PURPOSES
-- ----------------------------------------------------------------------------
CREATE TYPE principal_category_type AS ENUM (
    'customer',
    'employee',
    'job_applicant',
    'minor',
    'vendor_personnel',
    'shareholder'
);

CREATE TABLE data_principals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    external_ref VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_masked VARCHAR(50),
    email_masked VARCHAR(255),
    category principal_category_type DEFAULT 'customer',
    is_minor BOOLEAN DEFAULT FALSE,
    guardian_name VARCHAR(255),
    guardian_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    UNIQUE (tenant_id, external_ref)
);

CREATE TYPE lawful_basis_type AS ENUM (
    'consent',
    'certain_legitimate_uses_employment',
    'certain_legitimate_uses_legal_obligation',
    'certain_legitimate_uses_medical_emergency',
    'certain_legitimate_uses_public_interest',
    'statutory_compliance'
);

CREATE TABLE processing_purposes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lawful_basis lawful_basis_type NOT NULL DEFAULT 'consent',
    lawful_basis_details TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    retention_period_months INT DEFAULT 36,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    UNIQUE (tenant_id, code)
);

-- ----------------------------------------------------------------------------
-- 5. DATA INVENTORY (Assets & Legacy Data Items)
-- ----------------------------------------------------------------------------
CREATE TYPE asset_type_enum AS ENUM (
    'relational_db',
    'nosql_db',
    'cloud_bucket',
    'file_share',
    'saas_application',
    'internal_api',
    'physical_archive'
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    asset_type asset_type_enum NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    principal_categories TEXT[] DEFAULT '{}',
    hosting_geography VARCHAR(100) DEFAULT 'India (ap-south-1)',
    is_cross_border BOOLEAN DEFAULT FALSE,
    encryption_at_rest BOOLEAN DEFAULT TRUE,
    encryption_in_transit BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE legacy_data_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    estimated_volume VARCHAR(100),
    data_categories TEXT[] DEFAULT '{}',
    risk_level VARCHAR(50) DEFAULT 'medium',
    remediation_status VARCHAR(50) DEFAULT 'under_review',
    remediation_owner VARCHAR(255),
    target_remediation_date DATE,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 6. RECORD OF PROCESSING ACTIVITIES (RoPA) & DATA FLOWS
-- ----------------------------------------------------------------------------
CREATE TABLE ropa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    purpose_id UUID REFERENCES processing_purposes(id) ON DELETE SET NULL,
    purpose_name VARCHAR(255) NOT NULL,
    lawful_basis lawful_basis_type NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    principal_categories TEXT[] DEFAULT '{}',
    linked_asset_ids UUID[] DEFAULT '{}',
    manual_asset_refs TEXT[] DEFAULT '{}',
    processor_names TEXT[] DEFAULT '{}',
    retention_rationale TEXT NOT NULL,
    safeguards TEXT NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'draft',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE data_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_entity VARCHAR(255) NOT NULL,
    destination_entity VARCHAR(255) NOT NULL,
    direction VARCHAR(50) DEFAULT 'internal_to_external',
    data_categories TEXT[] DEFAULT '{}',
    purpose_name VARCHAR(255) NOT NULL,
    transfer_mechanism VARCHAR(100) DEFAULT 'Standard Contractual Clauses',
    destination_geography VARCHAR(100) DEFAULT 'India',
    is_cross_border BOOLEAN DEFAULT FALSE,
    safeguards TEXT,
    risk_level VARCHAR(50) DEFAULT 'low',
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 7. VENDORS & DATA PROCESSING AGREEMENTS (DPAs)
-- ----------------------------------------------------------------------------
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    services_provided TEXT NOT NULL,
    onboarding_stage VARCHAR(50) DEFAULT 'registration',
    dpa_status VARCHAR(50) DEFAULT 'missing',
    dpa_signed_at TIMESTAMPTZ,
    dpa_expires_at TIMESTAMPTZ,
    risk_tier VARCHAR(50) DEFAULT 'medium',
    subprocessors TEXT[] DEFAULT '{}',
    hosting_geography VARCHAR(100) DEFAULT 'India',
    security_score INT DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 8. PRIVACY NOTICES & CONSENT RECORDS
-- ----------------------------------------------------------------------------
CREATE TYPE notice_type_enum AS ENUM (
    'consent',
    'general_privacy',
    'employee',
    'cctv_surveillance'
);

CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    notice_type notice_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    content_html TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    principal_id UUID NOT NULL REFERENCES data_principals(id) ON DELETE CASCADE,
    notice_id UUID REFERENCES notices(id),
    notice_version VARCHAR(20) NOT NULL,
    notice_snapshot_hash VARCHAR(64) NOT NULL,
    notice_snapshot_text TEXT NOT NULL,
    purpose_id UUID REFERENCES processing_purposes(id),
    purpose_name VARCHAR(255) NOT NULL,
    consent_state VARCHAR(50) DEFAULT 'active', -- active, withdrawn, expired
    collection_channel VARCHAR(50) DEFAULT 'web_widget',
    ip_address_masked VARCHAR(50),
    user_agent_masked VARCHAR(255),
    receipt_token VARCHAR(100) UNIQUE NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    withdrawn_at TIMESTAMPTZ,
    withdrawal_reason TEXT
);

CREATE TABLE parental_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES consent_records(id) ON DELETE CASCADE,
    minor_principal_id UUID REFERENCES data_principals(id) ON DELETE CASCADE,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_id_type VARCHAR(50) NOT NULL,
    verification_token VARCHAR(100) NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    status VARCHAR(50) DEFAULT 'verified'
);

-- ----------------------------------------------------------------------------
-- 9. DATA PRINCIPAL RIGHTS (DSR) & GRIEVANCE REDRESSAL
-- ----------------------------------------------------------------------------
CREATE TYPE rights_request_type AS ENUM (
    'access_info',
    'correction_update',
    'erasure',
    'grievance',
    'nomination'
);

CREATE TABLE rights_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    reference_no VARCHAR(50) UNIQUE NOT NULL,
    principal_id UUID REFERENCES data_principals(id) ON DELETE SET NULL,
    principal_name VARCHAR(255) NOT NULL,
    principal_contact VARCHAR(255) NOT NULL,
    request_type rights_request_type NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'received',
    assigned_to VARCHAR(255),
    submitted_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    statutory_deadline TIMESTAMPTZ NOT NULL,
    internal_sla_deadline TIMESTAMPTZ NOT NULL,
    rule_version_id VARCHAR(50) DEFAULT 'DPDPA-SEC11-V1',
    outcome_summary TEXT,
    retention_exception_reason TEXT,
    is_legal_hold BOOLEAN DEFAULT FALSE,
    evidence_doc_count INT DEFAULT 0,
    closed_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 10. DPIA & RISK REGISTER
-- ----------------------------------------------------------------------------
CREATE TABLE dpia_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    project_scope TEXT NOT NULL,
    screening_outcome VARCHAR(50) DEFAULT 'dpia_required',
    processing_context TEXT,
    necessity_rationale TEXT,
    residual_risk_level VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'screening',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_module VARCHAR(50) NOT NULL,
    source_entity_id VARCHAR(100),
    deduplication_key VARCHAR(255) NOT NULL,
    likelihood INT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INT NOT NULL CHECK (impact BETWEEN 1 AND 5),
    inherent_risk_score INT NOT NULL,
    residual_risk_score INT NOT NULL,
    mitigation_plan TEXT,
    status VARCHAR(50) DEFAULT 'open',
    owner VARCHAR(255) NOT NULL,
    review_due_at DATE,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    UNIQUE (tenant_id, deduplication_key)
);

-- ----------------------------------------------------------------------------
-- 11. COMPLIANCE AUTOMATION (Tasks, Schedules & Calendar)
-- ----------------------------------------------------------------------------
CREATE TABLE compliance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to VARCHAR(255) NOT NULL,
    source_module VARCHAR(50),
    source_event_id UUID,
    completion_evidence TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE retention_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    data_category VARCHAR(100) NOT NULL,
    legal_retention_days INT NOT NULL,
    legal_basis_citation VARCHAR(255) NOT NULL,
    deletion_method VARCHAR(100) DEFAULT 'cryptographic_erasure',
    review_frequency_days INT DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 12. BREACH MANAGEMENT (Section 8(6) & Section 14 DPDPA)
-- ----------------------------------------------------------------------------
CREATE TABLE breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    reference_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    incident_severity VARCHAR(20) NOT NULL,
    detection_timestamp TIMESTAMPTZ NOT NULL,
    containment_status VARCHAR(50) DEFAULT 'investigating',
    affected_data_categories TEXT[] DEFAULT '{}',
    affected_principals_count INT DEFAULT 0,
    initial_dpbi_status VARCHAR(50) DEFAULT 'draft',
    initial_dpbi_deadline TIMESTAMPTZ NOT NULL,
    initial_dpbi_submitted_at TIMESTAMPTZ,
    detailed_dpbi_status VARCHAR(50) DEFAULT 'draft',
    detailed_dpbi_deadline TIMESTAMPTZ NOT NULL,
    detailed_dpbi_submitted_at TIMESTAMPTZ,
    principal_notification_status VARCHAR(50) DEFAULT 'pending_approval',
    principal_notification_count INT DEFAULT 0,
    post_incident_review TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 13. AUDIT LOGS & TRANSACTIONAL EVENT OUTBOX
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    old_state_json JSONB,
    new_state_json JSONB,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE compliance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    source_module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    payload_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, published, failed
    retry_count INT DEFAULT 0,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    published_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 14. REGULATORY RULES REGISTRY & DEADLINE OVERRIDES
-- ----------------------------------------------------------------------------
CREATE TABLE regulatory_rules (
    id VARCHAR(50) PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL,
    instrument VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    official_source_url TEXT NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    statutory_deadline_hours INT NOT NULL,
    jurisdiction VARCHAR(50) DEFAULT 'India',
    status VARCHAR(50) DEFAULT 'verified',
    commencement_date DATE,
    last_reviewed_at TIMESTAMPTZ
);

CREATE TABLE deadline_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    original_deadline TIMESTAMPTZ NOT NULL,
    override_deadline TIMESTAMPTZ NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE tool_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_data_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ropa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_overrides ENABLE ROW LEVEL SECURITY;

-- Note: In production PostgreSQL, app sets: SET LOCAL app.current_tenant_id = 'tenant-uuid';
CREATE POLICY tenant_isolation_tool_entitlements ON tool_entitlements
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_memberships ON memberships
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_principals ON data_principals
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_purposes ON processing_purposes
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_assets ON assets
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_legacy ON legacy_data_items
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_ropa ON ropa_records
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_flows ON data_flows
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_vendors ON vendors
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_notices ON notices
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_consent ON consent_records
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_parental ON parental_verifications
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_rights ON rights_requests
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_dpia ON dpia_records
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_risks ON risks
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_tasks ON compliance_tasks
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_retention ON retention_schedules
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_breaches ON breaches
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_audit ON audit_logs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_events ON compliance_events
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation_overrides ON deadline_overrides
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
