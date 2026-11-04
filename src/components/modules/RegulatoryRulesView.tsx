import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Scale,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  Plus,
} from 'lucide-react';

export const RegulatoryRulesView: React.FC = () => {
  const { apiFetch, currentUserRole, refreshAll } = useApp();
  const [rules, setRules] = useState<any[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Override Form
  const [entityType, setEntityType] = useState('rights_request');
  const [entityId, setEntityId] = useState('DSR-2026-BP-00104');
  const [overrideDeadline, setOverrideDeadline] = useState('2026-04-10T10:00:00Z');
  const [reason, setReason] = useState('Extensive multi-entity cross-border archive search required');

  const canOverride = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadRules = async () => {
    try {
      const list = await apiFetch('/api/v1/rules');
      setRules(list);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  useEffect(() => {
    loadRules();
  }, [apiFetch]);

  const handleRecordOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/rules/override', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          original_deadline: new Date().toISOString(),
          override_deadline: overrideDeadline,
          reason,
        }),
      });
      setShowOverrideModal(false);
      alert('Statutory deadline extension officially logged in immutable audit trail.');
      await refreshAll();
    } catch (err) {
      console.error('Failed to log deadline override:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
              Statutory Rules & Deadlines
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Jurisdiction: Republic of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-indigo-600" />
            <span>Regulatory Rules & Deadline Engine</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Versioned regulatory register mapping DPDPA 2023 statutory sections, official commencement gazettes, triggers, and time limits. Separates internal SLAs from regulatory deadlines.
          </p>
        </div>

        {canOverride && (
          <button
            onClick={() => setShowOverrideModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>+ Document Deadline Override</span>
          </button>
        )}
      </div>

      {/* Rules Registry Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Active Legal Instruments & Statutory Timelines
          </h2>
          <span className="text-xs font-mono text-slate-500">Registered Rules: {rules.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Rule Code & Section</th>
                <th className="p-3">Legal Instrument</th>
                <th className="p-3">Trigger Event</th>
                <th className="p-3">Statutory Deadline</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Official Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{rule.rule_code}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{rule.section}</div>
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs">{rule.instrument}</td>
                  <td className="p-3 text-slate-500">{rule.trigger_event}</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">
                    {rule.statutory_deadline_hours > 0 ? `${rule.statutory_deadline_hours} hours (${Math.round(rule.statutory_deadline_hours / 24)} days)` : 'Immediate'}
                  </td>
                  <td className="p-3">
                    {rule.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Verified Gazette
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Review Required
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={rule.official_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-mono text-[11px] underline"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Document Statutory Deadline Extension</h3>
            <p className="text-xs text-slate-500">
              Every extension records who made it, the reason, and the previous and revised deadlines.
            </p>

            <form onSubmit={handleRecordOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Target Reference No *</label>
                <input
                  type="text"
                  required
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Extended Deadline *</label>
                <input
                  type="text"
                  required
                  value={overrideDeadline}
                  onChange={(e) => setOverrideDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Documented Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Log Extension in Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
