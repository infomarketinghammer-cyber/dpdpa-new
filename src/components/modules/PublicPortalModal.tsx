import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';

export const PublicPortalModal: React.FC = () => {
  const { showPublicPortal, setShowPublicPortal, currentTenant } = useApp();
  const [activeTab, setActiveTab] = useState<'submit' | 'status' | 'consent'>('submit');

  // Submit form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [requestType, setRequestType] = useState('access_info');
  const [details, setDetails] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Status check state
  const [refQuery, setRefQuery] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [queryResult, setQueryResult] = useState<any | null>(null);

  if (!showPublicPortal) return null;

  const handleSubmitRights = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/public/rights-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id,
          principal_name: name,
          principal_contact: contact,
          request_type: requestType,
          details,
        }),
      });
      const data = await res.json();
      setSubmittedRef(data.reference_no);
      setName('');
      setContact('');
      setDetails('');
    } catch (err) {
      console.error('Failed to submit request:', err);
    }
  };

  const handleQueryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refQuery) return;

    if (!otpStep) {
      // Trigger simulated OTP
      setOtpStep(true);
      return;
    }

    try {
      const res = await fetch(`/api/v1/public/rights-status?reference_no=${encodeURIComponent(refQuery)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      alert('Reference number not found or invalid.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-md w-full shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Device Frame Header */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-900">
              Data Principal Self-Service Portal
            </span>
          </div>
          <button
            onClick={() => setShowPublicPortal(false)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 flex flex-wrap items-center justify-between font-mono gap-2">
          <span>{currentTenant?.dba_name || currentTenant?.legal_name}</span>
          <span className="text-[10px] text-slate-500">DPDPA 2023 Verified</span>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2.5 text-center transition cursor-pointer ${
              activeTab === 'submit' ? 'text-emerald-700 border-b-2 border-emerald-400 font-bold' : 'text-slate-500'
            }`}
          >
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 text-center transition cursor-pointer ${
              activeTab === 'status' ? 'text-emerald-700 border-b-2 border-emerald-400 font-bold' : 'text-slate-500'
            }`}
          >
            Check Status
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'submit' && (
            <div>
              {submittedRef ? (
                <div className="p-5 bg-slate-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Request Submitted Under DPDPA</h3>
                  <p className="text-slate-500 text-[11px]">
                    Your statutory reference number has been generated. Use this to track fulfillment progress:
                  </p>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-base font-extrabold text-emerald-700">
                    {submittedRef}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Statutory response deadline: 30 days. You will receive an SMS/Email notification upon resolution.
                  </p>
                  <button
                    onClick={() => setSubmittedRef(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRights} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Anjali Shinde"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Mobile / Email Address *</label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98200 00000 or email@domain.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Select Statutory Right *</label>
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    >
                      <option value="access_info">Right to Access / Information (Sec 11(1))</option>
                      <option value="correction_update">Right to Correction & Updating (Sec 11(2))</option>
                      <option value="erasure">Right to Erasure / Deletion (Sec 11(3))</option>
                      <option value="grievance">Grievance Redressal (Sec 12)</option>
                      <option value="nomination">Right of Nomination (Sec 14)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Specific Details *</label>
                    <textarea
                      required
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Please specify what data or correction you are requesting..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/15"
                  >
                    Submit Statutory Request
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              {!queryResult ? (
                <form onSubmit={handleQueryStatus} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Request Reference Number *</label>
                    <input
                      type="text"
                      required
                      value={refQuery}
                      onChange={(e) => setRefQuery(e.target.value)}
                      placeholder="e.g., DSR-2026-BP-00104"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>

                  {otpStep && (
                    <div className="p-3 bg-slate-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="text-[11px] text-emerald-700 font-bold">
                        OTP sent to your registered phone / email
                      </div>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-center tracking-widest text-sm"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    {otpStep ? 'Verify OTP & Retrieve Status' : 'Request OTP Verification'}
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
                    <span className="font-mono font-bold text-emerald-700">{queryResult.reference_no}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-900 uppercase">
                      {queryResult.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700">
                    <div>Type: <strong className="text-slate-900 capitalize">{queryResult.request_type}</strong></div>
                    <div>Submitted: <span>{new Date(queryResult.submitted_at).toLocaleDateString()}</span></div>
                    <div>Statutory Deadline: <span className="font-mono text-emerald-700">{new Date(queryResult.statutory_deadline).toLocaleDateString()}</span></div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
                    <span className="text-slate-500 font-bold block mb-1">Official Outcome & Resolution:</span>
                    {queryResult.outcome_summary}
                  </div>

                  <button
                    onClick={() => {
                      setQueryResult(null);
                      setOtpStep(false);
                      setRefQuery('');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs"
                  >
                    Check Another Reference
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
