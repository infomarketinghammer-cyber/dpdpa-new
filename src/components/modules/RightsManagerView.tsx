import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Filter,
  Plus,
  Send,
  Lock,
} from 'lucide-react';
import { RightsRequestType } from '../../types/index.ts';

export const RightsManagerView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [requests, setRequests] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  // New Request Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [principalName, setPrincipalName] = useState('');
  const [principalContact, setPrincipalContact] = useState('');
  const [requestType, setRequestType] = useState<RightsRequestType>('access_info');
  const [details, setDetails] = useState('');

  // Action / Legal Review State
  const [actionOutcome, setActionOutcome] = useState('');
  const [retentionException, setRetentionException] = useState('');
  const [isLegalHold, setIsLegalHold] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);
  const canMutate = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/rights/requests');
      setRequests(list);
    } catch (err) {
      console.error('Failed to load rights requests:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('rights_manager')) {
    return (
      <LockedModuleCard
        toolId="rights_manager"
        toolName="Data Principal Rights Manager"
        description="Fulfillment workflows for DPDPA Access, Correction, Erasure (with legal holds), Grievances (Section 12), and Nominee appointments."
      />
    );
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/rights/requests', {
        method: 'POST',
        body: JSON.stringify({
          principal_name: principalName,
          principal_contact: principalContact,
          request_type: requestType,
          details,
        }),
      });
      setShowCreateModal(false);
      setPrincipalName('');
      setPrincipalContact('');
      setDetails('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to log rights request:', err);
    }
  };

  const handleExecuteAction = async (action: string) => {
    if (!selectedReq) return;
    setIsProcessingAction(true);
    try {
      await apiFetch(`/api/v1/rights/requests/${selectedReq.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          outcome_summary: actionOutcome || undefined,
          retention_exception_reason: retentionException || undefined,
          is_legal_hold: isLegalHold,
        }),
      });
      setSelectedReq(null);
      setActionOutcome('');
      setRetentionException('');
      await loadData();
      await refreshAll();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getRemainingDays = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d Overdue`;
    return `${days}d left`;
  };

  const filtered = filterType === 'all'
    ? requests
    : requests.filter((r) => r.request_type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700">
              DPDPA Sections 11, 12 & 14 · Data Principal Rights Console
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-700" />
            <span>Data Principal Rights Manager</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Receive, verify, fulfill, and close statutory requests (Access, Correction, Erasure, Grievance, Nomination). Enforces statutory deadlines and documented retention exception holds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-100 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-mono"
          >
            <option value="all">All Request Types</option>
            <option value="access_info">Access / Information</option>
            <option value="correction_update">Correction / Update</option>
            <option value="erasure">Erasure / Deletion</option>
            <option value="grievance">Grievance Redressal (Sec 12)</option>
            <option value="nomination">Nomination (Sec 14)</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/15 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Request</span>
          </button>
        </div>
      </div>

      {/* Staff Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Active Data Principal Requests Queue
          </h2>
          <span className="text-xs font-mono text-slate-500">Total: {filtered.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Reference No</th>
                <th className="p-3">Data Principal</th>
                <th className="p-3">Request Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Statutory SLA</th>
                <th className="p-3">Legal Hold</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((r) => {
                const daysLeft = getRemainingDays(r.statutory_deadline);
                const isOverdue = daysLeft.includes('Overdue');

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{r.reference_no}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.principal_name}</div>
                      <div className="text-[10px] text-slate-400">{r.principal_contact}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700 uppercase text-[11px]">
                      {r.request_type.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`text-[11px] font-bold ${isOverdue ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {daysLeft}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.is_legal_hold ? (
                        <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          HOLD (Sec 8(7))
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">None</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReq(r)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono text-[11px] transition cursor-pointer"
                      >
                        Manage & Fulfill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment & Exception Review Drawer Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <span className="text-xs font-mono text-indigo-600">{selectedReq.reference_no}</span>
                <h3 className="font-bold text-base text-slate-900">
                  Fulfill {selectedReq.request_type.replace('_', ' ').toUpperCase()} Request
                </h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-500 hover:text-slate-900 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Data Principal:</span>{' '}
                <strong className="text-slate-900">{selectedReq.principal_name}</strong> ({selectedReq.principal_contact})
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Request Details:</span>
                <p className="text-slate-700 mt-0.5 italic">{selectedReq.details}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between text-slate-500 font-mono text-[11px] pt-1 gap-2">
                <span>Statutory Deadline: {new Date(selectedReq.statutory_deadline).toLocaleDateString()}</span>
                <span className="text-emerald-700">Rule: {selectedReq.rule_version_id}</span>
              </div>
            </div>

            {/* Erasure Legal Exception Hold Handler */}
            {selectedReq.request_type === 'erasure' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Erasure Exception & Legal Hold Review (Section 8(7))</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Under DPDPA Section 8(7), personal data required for statutory compliance (e.g. PMLA 2002 5-year ledger rule, GST audit) is exempt from immediate erasure. Document your exception rationale:
                </p>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Documented Statutory Exception Reason
                  </label>
                  <input
                    type="text"
                    value={retentionException}
                    onChange={(e) => setRetentionException(e.target.value)}
                    placeholder="e.g., PMLA 2002 ledger preservation hold applied"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isLegalHold}
                    onChange={(e) => setIsLegalHold(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-amber-800">
                    Apply Active Legal Hold Flag (Prevents Automated Shredding)
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">
                Fulfillment Outcome Summary / Response Payload
              </label>
              <textarea
                rows={3}
                value={actionOutcome}
                onChange={(e) => setActionOutcome(e.target.value)}
                placeholder="Document actions performed, tokenized download links dispatched, or specific records purged."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => handleExecuteAction('verify_identity')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-lg"
                >
                  Verify ID (OTP OK)
                </button>
                <button
                  onClick={() => handleExecuteAction('start_processing')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-lg"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleExecuteAction('fulfill')}
                  className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white text-xs rounded-lg font-medium"
                >
                  Fulfill Request
                </button>
              </div>

              {canApprove ? (
                <button
                  onClick={() => handleExecuteAction('close')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-500/15"
                >
                  Approve Closure (Approver Gate)
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">
                  Approver role needed for final closure
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Log Data Principal Rights Request</h3>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Principal Name *</label>
                <input
                  type="text"
                  required
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="e.g., Anjali Shinde"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Contact Email / Phone *</label>
                <input
                  type="text"
                  required
                  value={principalContact}
                  onChange={(e) => setPrincipalContact(e.target.value)}
                  placeholder="e.g., anjali.shinde@sample.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Request Type *</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="access_info">Right to Access / Information (Sec 11(1))</option>
                  <option value="correction_update">Right to Correction & Completion (Sec 11(2))</option>
                  <option value="erasure">Right to Erasure (Sec 11(3))</option>
                  <option value="grievance">Grievance Redressal (Sec 12)</option>
                  <option value="nomination">Right of Nomination (Sec 14)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Request Details *</label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Specific details of the Data Principal's request..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
