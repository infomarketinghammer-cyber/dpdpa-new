import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Trash2,
  Lock,
} from 'lucide-react';

export const ComplianceAutomationView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [retentionSchedules, setRetentionSchedules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'retention' | 'calendar'>('tasks');
  const [completingTask, setCompletingTask] = useState<any | null>(null);
  const [completionEvidence, setCompletionEvidence] = useState('');

  const canMutate = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [tList, rList] = await Promise.all([
        apiFetch('/api/v1/automation/tasks').catch(() => []),
        apiFetch('/api/v1/automation/retention-schedules').catch(() => []),
      ]);
      setTasks(tList);
      setRetentionSchedules(rList);
    } catch (err) {
      console.error('Failed to load automation data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('automation')) {
    return (
      <LockedModuleCard
        toolId="automation"
        toolName="Compliance Automation & Retention Engine"
        description="Automated task generation from consent withdrawals, DPA expiry alerts, retention schedules, and legal hold reviews."
      />
    );
  }

  const handleCompleteTask = async () => {
    if (!completingTask) return;
    try {
      await apiFetch(`/api/v1/automation/tasks/${completingTask.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completion_evidence: completionEvidence }),
      });
      setCompletingTask(null);
      setCompletionEvidence('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-700">
              DPDPA Section 8(7) · Asynchronous Automation & Retention Schedules
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-teal-700" />
            <span>Compliance Automation & Retention</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Executes automated cessation tasks upon consent withdrawals, tracks statutory retention limits, enforces legal holds, and schedules annual regulatory audits.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tasks & Cessations ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'retention' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Retention Schedules ({retentionSchedules.length})
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Obligation Tasks & Auto-Generated Cessations
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Active: {tasks.filter((t) => t.status !== 'completed').length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Task Title & Description</th>
                  <th className="p-3">Task Type</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      <div className="text-[10px] text-slate-500 max-w-sm truncate" title={t.description}>
                        {t.description}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-indigo-600 text-[11px]">
                      {t.task_type.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          t.priority === 'critical' || t.priority === 'high'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{t.assigned_to}</td>
                    <td className="p-3 font-mono text-slate-500">{t.due_date}</td>
                    <td className="p-3">
                      {t.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="text-amber-700 font-mono text-[10px] uppercase">
                          {t.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {t.status !== 'completed' && canMutate && (
                        <button
                          onClick={() => setCompletingTask(t)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-mono text-[11px] transition cursor-pointer"
                        >
                          Complete Task
                        </button>
                      )}
                      {t.status === 'completed' && (
                        <span className="text-[10px] text-slate-400 font-mono">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retention Schedules Tab */}
      {activeTab === 'retention' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            DPDPA Section 8(7) Retention Schedules & Cryptographic Deletion
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Personal Data Category</th>
                  <th className="p-3">Statutory Retention (Days)</th>
                  <th className="p-3">Legal Basis Citation</th>
                  <th className="p-3">Enforced Deletion Method</th>
                  <th className="p-3">Review Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {retentionSchedules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{r.data_category}</td>
                    <td className="p-3 font-mono text-indigo-600 font-bold">{r.legal_retention_days} days</td>
                    <td className="p-3 text-slate-700">{r.legal_basis_citation}</td>
                    <td className="p-3 font-mono text-emerald-700">{r.deletion_method}</td>
                    <td className="p-3 font-mono text-slate-500">Every {r.review_frequency_days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Complete Compliance Task</h3>
            <p className="text-xs text-slate-700">
              Provide verifiable completion evidence or execution audit log for:{' '}
              <strong className="text-slate-900">{completingTask.title}</strong>
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">
                Completion Evidence / Script Execution Log *
              </label>
              <textarea
                rows={3}
                required
                value={completionEvidence}
                onChange={(e) => setCompletionEvidence(e.target.value)}
                placeholder="e.g., Cryptographic key zeroized. S3 bucket lifecycle rule verified."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCompletingTask(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTask}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
              >
                Mark Task Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
