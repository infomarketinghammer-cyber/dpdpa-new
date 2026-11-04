import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Filter,
} from 'lucide-react';

export const RiskRegisterView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [risks, setRisks] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(4);
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [owner, setOwner] = useState('Security Operations');

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/risks');
      setRisks(list);
    } catch (err) {
      console.error('Failed to load risks:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('risk_register')) {
    return (
      <LockedModuleCard
        toolId="risk_register"
        toolName="Enterprise Risk Register (5x5 Matrix)"
        description="5x5 Likelihood x Impact privacy risk matrix, inherent vs residual risk scoring, automatic risk import from DPIAs, and mitigation sign-offs."
      />
    );
  }

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/risks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          likelihood,
          impact,
          mitigation_plan: mitigationPlan,
          owner,
        }),
      });
      setShowLogModal(false);
      setTitle('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to log risk:', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-rose-600 bg-rose-100 border-rose-200';
    if (score >= 8) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-600">
              Enterprise Risk Governance · 5x5 Likelihood x Impact
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            <span>Privacy Risk Register</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Inherent vs residual risk scoring. Consolidates risks automatically from Discovery, DPIAs, and Vendor assessments without duplicates.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/15 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Operational Risk</span>
        </button>
      </div>

      {/* 5x5 Visual Risk Matrix Snapshot */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          5x5 Likelihood x Impact Matrix (Active Distribution)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <div className="text-[10px] text-rose-600 uppercase">Critical Risks (Score 15-25)</div>
            <div className="text-3xl font-black text-rose-600 mt-1">
              {risks.filter((r) => r.inherent_risk_score >= 15).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Immediate remediation required</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-[10px] text-amber-700 uppercase">Medium Risks (Score 8-14)</div>
            <div className="text-3xl font-black text-amber-700 mt-1">
              {risks.filter((r) => r.inherent_risk_score >= 8 && r.inherent_risk_score < 15).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Targeted mitigation scheduled</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-[10px] text-emerald-700 uppercase">Low Residual Risks (Score 1-7)</div>
            <div className="text-3xl font-black text-emerald-700 mt-1">
              {risks.filter((r) => r.inherent_risk_score < 8).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Acceptable tolerance</div>
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Enterprise Risk Ledger (Deduplicated Source Records)
          </h2>
          <span className="text-xs font-mono text-slate-500">Total Risks: {risks.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Risk Title</th>
                <th className="p-3">Source Module</th>
                <th className="p-3 text-center">Inherent Score (L x I)</th>
                <th className="p-3 text-center">Residual Score</th>
                <th className="p-3">Mitigation Plan</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {risks.map((rk) => (
                <tr key={rk.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{rk.title}</div>
                  </td>
                  <td className="p-3 font-mono text-indigo-600 text-[11px]">{rk.source_module}</td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${getScoreColor(rk.inherent_risk_score)}`}>
                      {rk.inherent_risk_score} ({rk.likelihood}x{rk.impact})
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-emerald-700 font-bold">
                    {rk.residual_risk_score}
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs truncate" title={rk.mitigation_plan}>
                    {rk.mitigation_plan}
                  </td>
                  <td className="p-3 text-slate-700">{rk.owner}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                      {rk.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Log Privacy Risk</h3>

            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Risk Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Unencrypted database backups in DR site"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Likelihood (1-5)</label>
                  <select
                    value={likelihood}
                    onChange={(e) => setLikelihood(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value={1}>1 - Rare</option>
                    <option value={2}>2 - Unlikely</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Likely</option>
                    <option value={5}>5 - Almost Certain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Impact (1-5)</label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value={1}>1 - Negligible</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Major</option>
                    <option value={5}>5 - Catastrophic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Mitigation Plan</label>
                <textarea
                  rows={2}
                  value={mitigationPlan}
                  onChange={(e) => setMitigationPlan(e.target.value)}
                  placeholder="Steps to remediate..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Owner</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
