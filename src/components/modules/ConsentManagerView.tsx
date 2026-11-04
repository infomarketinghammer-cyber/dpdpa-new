import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  CheckSquare,
  Shield,
  FileText,
  UserCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ConsentManagerView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [purposes, setPurposes] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [parentalVerifications, setParentalVerifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'capture' | 'parental' | 'purposes'>('records');

  // New Consent Form State
  const [principalName, setPrincipalName] = useState('');
  const [selectedPurposeId, setSelectedPurposeId] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianIdType, setGuardianIdType] = useState('Aadhaar OKYC Sandbox');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected consent for receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Withdrawal modal
  const [withdrawingConsent, setWithdrawingConsent] = useState<any | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');

  const canMutate = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [purpList, conList, pverList] = await Promise.all([
        apiFetch('/api/v1/consent/purposes').catch(() => []),
        apiFetch('/api/v1/consent/records').catch(() => []),
        apiFetch('/api/v1/consent/parental-verifications').catch(() => []),
      ]);
      setPurposes(purpList);
      setConsents(conList);
      setParentalVerifications(pverList);
      if (purpList.length > 0 && !selectedPurposeId) {
        setSelectedPurposeId(purpList[0].id);
      }
    } catch (err) {
      console.error('Failed to load consent data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('consent_manager')) {
    return (
      <LockedModuleCard
        toolId="consent_manager"
        toolName="Consent & Preference Manager"
        description="Manages unbundled affirmative consent capture, statutory notices, cryptographic receipts, and minor parental verification."
      />
    );
  }

  const handleGrantConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalName || !selectedPurposeId) return;

    setIsSubmitting(true);
    try {
      const selectedPurp = purposes.find((p) => p.id === selectedPurposeId);
      const res = await apiFetch('/api/v1/consent/grant', {
        method: 'POST',
        body: JSON.stringify({
          principal_name: principalName,
          purpose_id: selectedPurposeId,
          purpose_name: selectedPurp?.name || 'Processing Purpose',
          is_minor: isMinor,
          guardian_name: isMinor ? guardianName : undefined,
          guardian_id_type: isMinor ? guardianIdType : undefined,
          collection_channel: 'web_widget',
        }),
      });

      setPrincipalName('');
      setIsMinor(false);
      setGuardianName('');
      setActiveTab('records');
      await loadData();
      await refreshAll();
      setSelectedReceipt(res.consent);
    } catch (err) {
      console.error('Failed to record consent:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!withdrawingConsent) return;
    try {
      await apiFetch('/api/v1/consent/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          consent_id: withdrawingConsent.id,
          reason: withdrawalReason || 'Data Principal self-service preference portal',
        }),
      });
      setWithdrawingConsent(null);
      setWithdrawalReason('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to withdraw consent:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700">
              DPDPA Section 6 & Section 9 · Consent Architecture
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-700" />
            <span>Consent & Preference Manager</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Capture unbundled, affirmative purpose-level consent. Generates cryptographic receipts, verifiable guardian records, and automated cessation tasks upon withdrawal.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'records' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active Consents ({consents.length})
          </button>
          <button
            onClick={() => setActiveTab('capture')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'capture' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            + Capture Choice
          </button>
          <button
            onClick={() => setActiveTab('parental')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'parental' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Parental Verifications ({parentalVerifications.length})
          </button>
          <button
            onClick={() => setActiveTab('purposes')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'purposes' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Purpose Registry ({purposes.length})
          </button>
        </div>
      </div>

      {/* 1. Records Tab */}
      {activeTab === 'records' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Consent Register
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Unbundled Opt-ins: 100% · Zero Pre-ticked Boxes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Receipt Token</th>
                  <th className="p-3">Data Principal</th>
                  <th className="p-3">Processing Purpose</th>
                  <th className="p-3">Notice Snapshot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Granted Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consents.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{c.receipt_token}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.principal_name || 'Principal'}</td>
                    <td className="p-3 text-slate-800">{c.purpose_name}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {c.notice_version} (SHA:{c.notice_snapshot_hash.substring(0, 8)}...)
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          c.consent_state === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {c.consent_state}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {new Date(c.granted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReceipt(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono text-[11px] transition cursor-pointer"
                      >
                        View Receipt
                      </button>

                      {c.consent_state === 'active' && canMutate && (
                        <button
                          onClick={() => setWithdrawingConsent(c)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-50 border border-rose-200 text-rose-700 rounded font-mono text-[11px] transition cursor-pointer"
                          title="Withdraw consent and trigger automated cessation task"
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Capture Consent Tab (Interactive Section 6 Widget) */}
      {activeTab === 'capture' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900">DPDPA Affirmative Consent Capture Widget</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Preview of the consent notice shown to users: itemised purposes, unbundled checkboxes, and parental identity verification for minors under Section 9.
          </p>

          <form onSubmit={handleGrantConsent} className="space-y-5">
            {/* Active Notice Preview Banner */}
            <div className="bg-slate-50 border border-indigo-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between text-indigo-600 font-mono font-semibold gap-2">
                <span>Active DPDPA Notice v2.1</span>
                <span>Language: English</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                By ticking the affirmative purpose below, you authorize {currentTenant?.legal_name} to process specified personal data strictly for the specified activity. You retain the right of withdrawal at any time.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                Data Principal Full Name *
              </label>
              <input
                type="text"
                required
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="e.g., Rohan Deshmukh"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                Processing Purpose (Granular & Unbundled) *
              </label>
              <select
                value={selectedPurposeId}
                onChange={(e) => setSelectedPurposeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {purposes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.lawful_basis})
                  </option>
                ))}
              </select>
            </div>

            {/* Minor Verification Checkbox */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Data Principal is a Minor (&lt;18 years) · Requires Verifiable Parental Consent (Sec 9)
                </span>
              </label>

              {isMinor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      Parent / Legal Guardian Name *
                    </label>
                    <input
                      type="text"
                      required={isMinor}
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g., Sunita Deshmukh"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      Verification Verification Method
                    </label>
                    <select
                      value={guardianIdType}
                      onChange={(e) => setGuardianIdType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="Aadhaar OKYC Sandbox">Aadhaar OKYC e-Verification</option>
                      <option value="DigiLocker Guardian Link">DigiLocker Guardian Link</option>
                      <option value="Court Appointment Document">Court Guardianship Order</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Unbundled Affirmation Checkbox */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-0"
                />
                <span className="text-xs text-slate-700">
                  <strong className="text-emerald-700">Affirmative Action:</strong> I have reviewed the itemised notice snapshot above and freely grant specific, informed consent for this specified purpose alone.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canMutate}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/15 transition cursor-pointer"
            >
              {isSubmitting ? 'Recording Cryptographic Consent...' : 'Record Affirmative Consent Decision'}
            </button>
          </form>
        </div>
      )}

      {/* 3. Parental Verifications Tab */}
      {activeTab === 'parental' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              DPDPA Section 9 Minor Verifiable Parental Consent Log
            </h2>
            <span className="text-xs text-amber-700 font-mono">
              Tracking & Behavioral Profiling Prohibited on Minors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Verification Token</th>
                  <th className="p-3">Guardian Name</th>
                  <th className="p-3">Verification Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verified Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parentalVerifications.map((pv) => (
                  <tr key={pv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-indigo-600">{pv.verification_token}</td>
                    <td className="p-3 font-semibold text-slate-900">{pv.guardian_name}</td>
                    <td className="p-3 text-slate-700">{pv.guardian_id_type}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {pv.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {new Date(pv.verified_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Purpose Registry Tab */}
      {activeTab === 'purposes' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Itemised Purpose Registry (Lawful Basis Mapping)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purposes.map((p) => (
              <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed">{p.description}</p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between font-mono text-[11px] gap-2">
                  <span className="text-indigo-600">Basis: {p.lawful_basis}</span>
                  <span className="text-slate-400">Retention: {p.retention_period_months} months</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cryptographic Consent Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">DPDPA Cryptographic Consent Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-500 hover:text-slate-900 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-700">
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Receipt Token:</span>
                <div className="text-indigo-600 font-bold">{selectedReceipt.receipt_token}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Data Principal:</span>
                <div className="text-slate-900">{selectedReceipt.principal_name}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Specified Purpose:</span>
                <div className="text-slate-900">{selectedReceipt.purpose_name}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Immutable Notice Hash:</span>
                <div className="text-slate-500 text-[10px] break-all">{selectedReceipt.notice_snapshot_hash}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Collection Channel & IP:</span>
                <div className="text-slate-500">
                  {selectedReceipt.collection_channel} ({selectedReceipt.ip_address_masked})
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Timestamp (UTC / IST):</span>
                <div className="text-slate-500">{new Date(selectedReceipt.granted_at).toISOString()}</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Receipt serves as evidentiary proof of affirmative consent under DPDPA Section 6(1). Notice snapshot is permanently immutable.
            </p>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal (Tests Phase 1 event emission) */}
      {withdrawingConsent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Withdraw Consent & Publish Cessation Event</h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Withdrawing consent for <strong className="text-slate-900">{withdrawingConsent.principal_name}</strong> on purpose <strong className="text-slate-900">{withdrawingConsent.purpose_name}</strong> will update the record and automatically create follow-up tasks to stop processing that data.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-amber-800">
              ⚡ Compliance Automation will automatically create a 30-day processing cessation and data purge task upon withdrawal.
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">
                Reason for Withdrawal
              </label>
              <input
                type="text"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="e.g., Principal opt-out via preference portal"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setWithdrawingConsent(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdrawal}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-500/15 cursor-pointer"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
