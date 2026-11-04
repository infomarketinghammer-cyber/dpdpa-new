import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  Flame,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  FileText,
  UserCheck,
  Lock,
} from 'lucide-react';

export const BreachManagerView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [breaches, setBreaches] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [affectedCategories, setAffectedCategories] = useState('Customer Phone, Transaction Logs');
  const [affectedCount, setAffectedCount] = useState(5000);

  const canApproveFiling = currentUserRole === 'ppoc_cpo';

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/breach/incidents');
      setBreaches(list);
    } catch (err) {
      console.error('Failed to load breach incidents:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('breach_manager')) {
    return (
      <LockedModuleCard
        toolId="breach_manager"
        toolName="Personal Data Breach Manager"
        description="Statutory breach workflow under Section 8(6) DPDPA, 6h initial / 72h detailed DPBI notifications, and Data Principal batch notifications."
      />
    );
  }

  const handleCreateBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/breach/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          incident_severity: severity,
          affected_data_categories: affectedCategories.split(',').map((s) => s.trim()),
          affected_principals_count: affectedCount,
        }),
      });
      setShowLogModal(false);
      setTitle('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to log breach incident:', err);
    }
  };

  const handleSubmitInitialDPBI = async (id: string) => {
    try {
      await apiFetch(`/api/v1/breach/incidents/${id}/submit-initial-dpbi`, { method: 'POST' });
      await loadData();
      await refreshAll();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const handleSubmitDetailedDPBI = async (id: string) => {
    try {
      await apiFetch(`/api/v1/breach/incidents/${id}/submit-detailed-dpbi`, { method: 'POST' });
      await loadData();
      await refreshAll();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const getRemainingTime = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return 'OVERDUE';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-600">
              DPDPA Section 8(6) · Personal Data Breach Management
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-rose-600" />
            <span>Personal Data Breach Management</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Mandatory notification to the Data Protection Board of India (DPBI) and affected Data Principals. Tracks initial 6-hour statutory alerts separately from 72-hour detailed forensic filings.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/15 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Report Personal Data Breach</span>
        </button>
      </div>

      {/* Active Breach Incidents Cards */}
      <div className="space-y-4">
        {breaches.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm text-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-rose-600 text-sm">{b.reference_no}</span>
                  <h3 className="font-bold text-base text-slate-900">{b.title}</h3>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Detected: {new Date(b.detection_timestamp).toLocaleString()} · Containment: <strong className="text-amber-800 uppercase">{b.containment_status}</strong>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full font-mono text-xs uppercase font-bold bg-rose-100 text-rose-600 border border-rose-200 self-start sm:self-auto">
                {b.incident_severity} Severity
              </span>
            </div>

            {/* Split Statutory Notification Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Initial 6-Hour Alert to DPBI */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between font-mono gap-2">
                  <span className="font-bold text-slate-900 text-xs">1. Initial DPBI Notification (6h)</span>
                  <span className="text-[10px] text-slate-500">Section 8(6) / CERT-In</span>
                </div>
                <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                  <div className="text-xs">
                    Status:{' '}
                    <strong
                      className={`font-mono uppercase ${
                        b.initial_dpbi_status === 'submitted' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {b.initial_dpbi_status}
                    </strong>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {b.initial_dpbi_status === 'submitted' ? (
                      <span className="text-emerald-700">
                        Submitted: {new Date(b.initial_dpbi_submitted_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">
                        {getRemainingTime(b.initial_dpbi_deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {b.initial_dpbi_status !== 'submitted' && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      CPO authorization required
                    </span>
                    {canApproveFiling ? (
                      <button
                        onClick={() => handleSubmitInitialDPBI(b.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        Authorize & Submit Initial Alert
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-mono">PPOC / CPO Role Needed</span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Detailed 72-Hour Comprehensive Report to DPBI */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between font-mono gap-2">
                  <span className="font-bold text-slate-900 text-xs">2. Detailed DPBI Filing (72h)</span>
                  <span className="text-[10px] text-slate-500">Draft DPBI Rules</span>
                </div>
                <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                  <div className="text-xs">
                    Status:{' '}
                    <strong
                      className={`font-mono uppercase ${
                        b.detailed_dpbi_status === 'submitted' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {b.detailed_dpbi_status}
                    </strong>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {b.detailed_dpbi_status === 'submitted' ? (
                      <span className="text-emerald-700">
                        Submitted: {new Date(b.detailed_dpbi_submitted_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">
                        {getRemainingTime(b.detailed_dpbi_deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {b.detailed_dpbi_status !== 'submitted' && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Forensic summary attached</span>
                    {canApproveFiling ? (
                      <button
                        onClick={() => handleSubmitDetailedDPBI(b.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        Authorize Detailed Filing
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-mono">PPOC / CPO Role Needed</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Impact & Principal Notifications Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-500 pt-1 text-[11px]">
              <div>
                Affected Categories: <strong className="text-slate-900">{b.affected_data_categories?.join(', ')}</strong>
              </div>
              <div>
                Data Principals Impacted:{' '}
                <strong className="text-slate-900 font-mono">{b.affected_principals_count.toLocaleString()}</strong> (Notice: <span className="uppercase text-amber-800 font-mono">{b.principal_notification_status}</span>)
              </div>
            </div>

            {b.post_incident_review && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <span className="font-bold text-slate-800">Post-Incident Review:</span> {b.post_incident_review}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Log Breach Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Report Personal Data Breach Incident</h3>

            <form onSubmit={handleCreateBreach} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Compromised Employee Credential on S3 Export"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Severity Classification *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="critical">Critical (Large scale PII or high harm potential)</option>
                  <option value="high">High (Financial or sensitive personal data)</option>
                  <option value="medium">Medium (Limited scope, quickly isolated)</option>
                  <option value="low">Low (Negligible harm risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Affected Categories</label>
                <input
                  type="text"
                  value={affectedCategories}
                  onChange={(e) => setAffectedCategories(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Estimated Principals Affected</label>
                <input
                  type="number"
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Number(e.target.value))}
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
                  Log & Start Statutory Timers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
