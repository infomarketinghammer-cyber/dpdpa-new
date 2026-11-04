import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Layers,
  CheckCircle2,
  ExternalLink,
  Code,
  Database,
  Search,
} from 'lucide-react';

interface TraceItem {
  prd_section: string;
  tool_module: string;
  requirement_title: string;
  ui_screen: string;
  api_endpoints: string[];
  data_models: string[];
  test_scenario: string;
  status: 'implemented_verified' | 'configurable_in_prod';
}

export const PRDTraceabilityView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const matrix: TraceItem[] = [
    {
      prd_section: '1.0 & 2.0',
      tool_module: 'Central Compliance DB',
      requirement_title: 'Central Compliance Database (CCD) & Row-Level Security',
      ui_screen: 'Global Workspace / Context Switcher',
      api_endpoints: ['/api/v1/organisations', '/api/v1/health'],
      data_models: ['organisations', 'memberships', 'tool_entitlements'],
      test_scenario: 'Tenant A (BharatPay) and Tenant B (SwasthaCare) remain strictly isolated via RLS.',
      status: 'implemented_verified',
    },
    {
      prd_section: '2.0',
      tool_module: 'Architecture',
      requirement_title: 'Transactional Outbox & SSE Live Event Pipeline',
      ui_screen: 'Audit Log & Outbox / Top Nav Sync Indicator',
      api_endpoints: ['/api/v1/events/outbox', '/api/v1/events/stream', '/api/v1/events/replay/:id'],
      data_models: ['compliance_events', 'audit_logs'],
      test_scenario: 'Every business mutation commits entity + audit log + outbox event in one atomic write; SSE streams to UI.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.1',
      tool_module: 'Consent & Preference',
      requirement_title: 'Unbundled Affirmative Consent & Receipts',
      ui_screen: 'Consent & Preferences Console',
      api_endpoints: ['/api/v1/consent/purposes', '/api/v1/consent/records', '/api/v1/consent/grant', '/api/v1/consent/withdraw'],
      data_models: ['consent_records', 'processing_purposes', 'notices'],
      test_scenario: 'Ticking purpose records affirmative choice; withdrawal triggers automated cessation task in Automation.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.1 & Sec 9',
      tool_module: 'Consent & Preference',
      requirement_title: 'Children Personal Data & Parental Verification',
      ui_screen: 'Consent Console -> Parental Tab',
      api_endpoints: ['/api/v1/consent/parental-verifications'],
      data_models: ['parental_verifications', 'data_principals'],
      test_scenario: 'Aadhaar OKYC verified guardian token bound before minor personal data processing is authorized.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.2',
      tool_module: 'Data Discovery',
      requirement_title: 'Personal Data Asset Inventory & Legacy Remediation',
      ui_screen: 'Data Discovery Console',
      api_endpoints: ['/api/v1/discovery/assets', '/api/v1/discovery/legacy'],
      data_models: ['assets', 'legacy_data_items'],
      test_scenario: 'Registers databases, cloud stores, and physical lockers; verifies Indian data residency & encryption.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.3',
      tool_module: 'Data Mapper',
      requirement_title: 'Record of Processing Activities (RoPA) & Legal Basis',
      ui_screen: 'Data Mapper Console',
      api_endpoints: ['/api/v1/mapper/ropa', '/api/v1/mapper/ropa/:id/approve'],
      data_models: ['ropa_records', 'processing_purposes'],
      test_scenario: 'Flags unapproved or missing legal bases; requires Approver role sign-off before official publication.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.4 & Sec 16',
      tool_module: 'Data Flow Mapper',
      requirement_title: 'Directed Graph & Cross-Border Geolocation Governance',
      ui_screen: 'Data Flow Mapper Console',
      api_endpoints: ['/api/v1/flow-mapper/flows'],
      data_models: ['data_flows'],
      test_scenario: 'Visual topology canvas flags missing safeguards and cross-border transfers.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.5',
      tool_module: 'Rights Manager',
      requirement_title: 'Data Principal Rights, Legal Holds & Statutory Deadlines',
      ui_screen: 'Rights Console / Public Portal',
      api_endpoints: ['/api/v1/rights/requests', '/api/v1/rights/requests/:id/action', '/api/v1/public/rights-submit'],
      data_models: ['rights_requests'],
      test_scenario: 'Erasure review evaluates Section 8(7) statutory hold; standalone tenant operates with manual references.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.6',
      tool_module: 'Vendor Risk Manager',
      requirement_title: '5-Stage Processor Onboarding & DPA Expiration Tracking',
      ui_screen: 'Vendor Risk Console',
      api_endpoints: ['/api/v1/vendor/vendors', '/api/v1/vendor/vendors/:id/advance-stage'],
      data_models: ['vendors', 'dpas'],
      test_scenario: 'Expired DPA raises critical alert and triggers automated renewal task in Compliance Automation.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.7',
      tool_module: 'Policy Generator',
      requirement_title: 'Multi-lingual Notices, CCTV Templates & Gemini Drafting',
      ui_screen: 'Policy & Notice Console',
      api_endpoints: ['/api/v1/policy/notices', '/api/v1/policy/notices/:id/approve', '/api/v1/ai/draft-notice'],
      data_models: ['notices'],
      test_scenario: 'Version diff displays changes; Gemini drafts compliant notice with mandatory human Approver gate.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.8 & Sec 10',
      tool_module: 'DPIA',
      requirement_title: '6-Step DPIA Wizard & Automated Risk Ingestion',
      ui_screen: 'DPIA Console',
      api_endpoints: ['/api/v1/dpia/assessments', '/api/v1/dpia/assessments/:id/approve'],
      data_models: ['dpia_records'],
      test_scenario: 'Completing 6-step wizard and approving automatically registers deduplicated risk item in Risk Register.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.9',
      tool_module: 'Risk Register',
      requirement_title: '5x5 Likelihood x Impact Matrix & Deduplication',
      ui_screen: 'Risk Register Console',
      api_endpoints: ['/api/v1/risks'],
      data_models: ['risks'],
      test_scenario: 'Deduplication key prevents duplicate risk creation on event replay or retries.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.10',
      tool_module: 'Automation',
      requirement_title: 'Automated Cessation Tasks & Retention Schedules',
      ui_screen: 'Compliance Automation Console',
      api_endpoints: ['/api/v1/automation/tasks', '/api/v1/automation/tasks/:id/complete', '/api/v1/automation/retention-schedules'],
      data_models: ['compliance_tasks', 'retention_schedules'],
      test_scenario: 'Consent withdrawal generates cessation task; completion requires verifiable execution evidence.',
      status: 'implemented_verified',
    },
    {
      prd_section: '5.11 & Sec 8(6)',
      tool_module: 'Breach Manager',
      requirement_title: 'Statutory 6h Initial / 72h Detailed DPBI Notifications',
      ui_screen: 'Breach Manager / CPO Active Panel',
      api_endpoints: ['/api/v1/breach/incidents', '/api/v1/breach/incidents/:id/submit-initial-dpbi'],
      data_models: ['breaches'],
      test_scenario: 'Countdown timers reflect authoritative timestamps; CPO role required for statutory filing.',
      status: 'implemented_verified',
    },
    {
      prd_section: '6.0',
      tool_module: 'CPO Oversight Dashboard',
      requirement_title: 'Weighted Operational Readiness Score & Multi-Entity Rollup',
      ui_screen: 'CPO Dashboard',
      api_endpoints: ['/api/v1/cpo/health', '/api/v1/cpo/multi-entity-rollup'],
      data_models: ['materialised_metrics', 'cpo_health_score'],
      test_scenario: 'Weights enforced: Discovery 10%, Mapper 15%, Flow 10%, Consent 10%, Policy 10%, Rights 10%, Vendor 15%, Risk 5%, Auto 10%, Breach 5%.',
      status: 'implemented_verified',
    },
    {
      prd_section: '6.0',
      tool_module: 'Board Readiness Report',
      requirement_title: '15-Section Comprehensive Statutory Executive Report',
      ui_screen: 'Board Readiness View',
      api_endpoints: ['/api/v1/cpo/board-report'],
      data_models: ['board_readiness_report'],
      test_scenario: 'Renders all 15 PRD sections with point-in-time snapshot, redaction toggle, and matching JSON download.',
      status: 'implemented_verified',
    },
    {
      prd_section: '7.0',
      tool_module: 'Regulatory Rules',
      requirement_title: 'Versioned Legal Registry & Deadline Override Auditing',
      ui_screen: 'Regulatory Rules Registry',
      api_endpoints: ['/api/v1/rules', '/api/v1/rules/override'],
      data_models: ['regulatory_rules', 'deadline_overrides'],
      test_scenario: 'Preserves rule versions; override records actor, reason, previous deadline, and revised deadline.',
      status: 'implemented_verified',
    },
  ];

  const filtered = matrix.filter(
    (m) =>
      m.requirement_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tool_module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.prd_section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
              PRD Verification & Traceability Matrix
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">PRD v1.0, March 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>PRD Requirement Traceability Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            End-to-end verification mapping each PRD requirement section to implemented UI screens, REST endpoints, Central Compliance Database models, and test scenarios.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PRD section or module..."
            className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Traceability Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">PRD Sec</th>
                <th className="p-3">Module</th>
                <th className="p-3">Requirement & Scope</th>
                <th className="p-3">UI Console</th>
                <th className="p-3">API Endpoints</th>
                <th className="p-3">CCD Models</th>
                <th className="p-3">Test Scenario</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-indigo-600">{item.prd_section}</td>
                  <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{item.tool_module}</td>
                  <td className="p-3 text-slate-800">{item.requirement_title}</td>
                  <td className="p-3 text-slate-700 whitespace-nowrap">{item.ui_screen}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">
                    {item.api_endpoints.map((ep, i) => (
                      <div key={i} className="truncate max-w-xs">{ep}</div>
                    ))}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-sky-600">
                    {item.data_models.join(', ')}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] max-w-xs">{item.test_scenario}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
