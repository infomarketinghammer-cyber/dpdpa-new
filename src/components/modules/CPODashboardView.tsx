import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Calendar,
  Building,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { ToolModuleType } from '../../types/index.ts';

export const CPODashboardView: React.FC = () => {
  const { isEntitled, currentTenant, healthScore, setActiveTab, apiFetch } = useApp();
  const [activeBreaches, setActiveBreaches] = useState<any[]>([]);
  const [multiEntityRollup, setMultiEntityRollup] = useState<any[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [breaches, rollup, tasks] = await Promise.all([
          apiFetch('/api/v1/breach/incidents').catch(() => []),
          apiFetch('/api/v1/cpo/multi-entity-rollup').catch(() => []),
          apiFetch('/api/v1/automation/tasks').catch(() => []),
        ]);
        setActiveBreaches(breaches.filter((b: any) => b.containment_status !== 'closed'));
        setMultiEntityRollup(rollup);
        setComplianceTasks(tasks);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('cpo_dashboard')) {
    return (
      <LockedModuleCard
        toolId="cpo_dashboard"
        toolName="CPO Oversight Dashboard"
        description="Premium executive governance workspace providing compliance health scores, active breach countdowns, and multi-entity rollups."
      />
    );
  }

  // Calculate live countdown helper
  const getRemainingTime = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return 'OVERDUE';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  const currentRollup = multiEntityRollup.find((e) => e.tenant_id === currentTenant?.id);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Health Score & Quick Report CTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
                Authoritative Executive Oversight · Section 8(5)
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Fiduciary: {currentTenant?.legal_name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              CPO Operational Readiness & Governance Console
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl mt-1">
              Overall compliance readiness across 10 DPDPA areas, with DPIA tracked separately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('board_report')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate 15-Section Board Report</span>
            </button>
          </div>
        </div>


        {/* Health Score Metric Card Row */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Normalized Readiness Score
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {healthScore ? healthScore.normalized_score : 0}%
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-medium ${getScoreBadgeColor(healthScore?.normalized_score || 0)}`}>
                {healthScore?.status_label || 'Calculating...'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Coverage: {healthScore?.coverage_percentage}% of DPDPA statutory weights
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Active Breach Incidents
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
              <span className={`text-3xl sm:text-4xl font-extrabold ${activeBreaches.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {activeBreaches.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {activeBreaches.length > 0 ? 'Immediate Attention' : 'Safe / Contained'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Statutory initial 6h / detailed 72h countdowns active
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              90-Day Regulatory Horizon
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-700">
                {complianceTasks.filter((t) => t.status !== 'completed').length}
              </span>
              <span className="text-xs text-slate-500 font-mono">Open Obligations</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Cessation, DPA renewals & retention schedules
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Open Risks
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-sky-600">
                {currentRollup ? currentRollup.open_risks : 0}
              </span>
              <span className="text-xs text-slate-500 font-mono">Risk Register</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Consolidated from Discovery, DPIA & Vendor reviews
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Breach Panel (Visible while incident is active per PRD) */}
      {activeBreaches.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>ACTIVE BREACH INCIDENT PANEL · SECTION 8(6) DPDPA</span>
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    CRITICAL OVERSIGHT
                  </span>
                </h3>
                <p className="text-xs text-rose-700">
                  Authoritative countdowns active. Data Protection Board of India (DPBI) statutory deadlines enforced.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('breach_manager')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <span>Manage in Breach Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBreaches.map((b) => (
              <div key={b.id} className="bg-white border border-rose-200 rounded-xl p-4 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{b.reference_no}: {b.title}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono font-bold text-[10px] uppercase">
                    {b.incident_severity} Severity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Initial DPBI Notice (6h)</div>
                    <div className="text-xs font-bold mt-1">
                      {b.initial_dpbi_status === 'submitted' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted on Time
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getRemainingTime(b.initial_dpbi_deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Detailed DPBI Filing (72h)</div>
                    <div className="text-xs font-bold mt-1">
                      {b.detailed_dpbi_status === 'submitted' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> {getRemainingTime(b.detailed_dpbi_deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-slate-500 pt-1 text-[11px] gap-2">
                  <span>Principals Affected: <strong className="text-slate-900">{b.affected_principals_count.toLocaleString()}</strong></span>
                  <span>Containment: <strong className="text-amber-800 uppercase">{b.containment_status}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Statutory Weights & Modular Health Breakdown (PRD Section 6) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Compliance Health by Module</span>
            </h2>
            <p className="text-xs text-slate-500">
              Each module scores data volume, pending items, and compliance approvals against statutory thresholds.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Total Scored Weights: 100% (DPIA separate)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthScore &&
            (Object.keys(healthScore.module_scores) as ToolModuleType[]).map((modKey) => {
              const item = healthScore.module_scores[modKey];
              if (modKey === 'cpo_dashboard') return null;

              const titleMap: Record<ToolModuleType, string> = {
                consent_manager: 'Consent & Preferences',
                data_discovery: 'Data Discovery',
                data_mapper: 'Data Mapper (RoPA)',
                flow_mapper: 'Data Flow Mapper',
                rights_manager: 'Data Principal Rights',
                vendor_manager: 'Vendor Risk & DPAs',
                policy_generator: 'Policy & Notices',
                dpia: 'DPIA Assessments',
                risk_register: 'Risk Register',
                automation: 'Compliance Automation',
                breach_manager: 'Breach Manager',
                cpo_dashboard: 'CPO Dashboard',
              };

              return (
                <div
                  key={modKey}
                  onClick={() => setActiveTab(modKey as any)}
                  className={`border rounded-xl p-4 transition cursor-pointer ${
                    item.is_entitled
                      ? 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900 truncate">{titleMap[modKey]}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.weight > 0 ? (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.weight}% Wt
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          Standalone
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      {item.is_entitled ? (
                        <span className={`text-2xl font-black ${item.score >= 80 ? 'text-emerald-700' : item.score >= 60 ? 'text-amber-700' : 'text-rose-600'}`}>
                          {item.score}%
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-400 uppercase">Unlicensed</span>
                      )}
                    </div>

                    <div className="text-[11px] text-right text-slate-500">
                      {item.is_entitled ? (
                        <span>
                          {item.data_volume} records {item.issues_count > 0 && <span className="text-amber-700 font-bold">({item.issues_count} pending)</span>}
                        </span>
                      ) : (
                        <span className="text-amber-700/80">Manual Ref Active</span>
                      )}
                    </div>
                  </div>

                  {/* Visual Bar */}
                  {item.is_entitled && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Multi-Entity Rollup (Comparing BharatPay vs SwasthaCare vs KisanTrade) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Multi-Entity Fiduciary Rollup</span>
            </h2>
            <p className="text-xs text-slate-500">
              Compare compliance readiness across your organisations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Entity Name</th>
                <th className="p-3">CIN (MCA)</th>
                <th className="p-3">Industry</th>
                <th className="p-3">SDF Status</th>
                <th className="p-3 text-center">Readiness</th>
                <th className="p-3 text-center">Coverage</th>
                <th className="p-3 text-center">Active Breaches</th>
                <th className="p-3 text-center">Open Risks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {multiEntityRollup.map((ent) => (
                <tr key={ent.tenant_id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{ent.legal_name}</td>
                  <td className="p-3 font-mono text-slate-500">{ent.cin}</td>
                  <td className="p-3 text-slate-700">{ent.industry}</td>
                  <td className="p-3">
                    {ent.is_sdf ? (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-mono">
                        Significant (Sec 10)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-mono">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold font-mono">
                    <span className={ent.health_score >= 80 ? 'text-emerald-700' : 'text-amber-700'}>
                      {ent.health_score}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">{ent.coverage_percentage}%</td>
                  <td className="p-3 text-center">
                    {ent.active_breaches > 0 ? (
                      <span className="bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold">
                        {ent.active_breaches} Active
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-mono">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono">{ent.open_risks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
