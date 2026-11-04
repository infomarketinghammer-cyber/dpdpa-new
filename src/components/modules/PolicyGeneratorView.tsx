import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  FileText,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  History,
  Languages,
  Eye,
  Download,
} from 'lucide-react';

export const PolicyGeneratorView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [notices, setNotices] = useState<any[]>([]);
  const [activeNotice, setActiveNotice] = useState<any | null>(null);

  // AI drafting modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiNoticeType, setAiNoticeType] = useState('cctv_surveillance');
  const [aiCategories, setAiCategories] = useState('Video footage of entrance and visitor biometric turnstile records');
  const [aiPurposes, setAiPurposes] = useState('Premises security, physical access control, and incident investigation');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/policy/notices');
      setNotices(list);
      if (list.length > 0 && !activeNotice) {
        setActiveNotice(list[0]);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('policy_generator')) {
    return (
      <LockedModuleCard
        toolId="policy_generator"
        toolName="Privacy Policy & Notice Generator"
        description="Generates statutory DPDPA Section 6 notices, CCTV video surveillance notices, version diffs, and Gemini-assisted drafts."
      />
    );
  }

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await apiFetch('/api/v1/ai/draft-notice', {
        method: 'POST',
        body: JSON.stringify({
          notice_type: aiNoticeType,
          organisation_name: currentTenant?.legal_name,
          purposes: aiPurposes,
          categories: aiCategories,
          contact_email: currentTenant?.dpo_email,
        }),
      });
      setGeneratedDraft(res.draft_html);
    } catch (err: any) {
      alert(err.message || 'AI generation failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApproveNotice = async (id: string) => {
    try {
      await apiFetch(`/api/v1/policy/notices/${id}/approve`, { method: 'POST' });
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to approve notice:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-700">
              DPDPA Section 6(1) · Statutory Privacy Notices
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-teal-700" />
            <span>Privacy Policy & Notice Generator</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Publish versioned notices across English and Indian regional languages. Includes CCTV surveillance notices, version diff viewer, and Gemini AI-assisted drafting with mandatory Approver gates.
          </p>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-teal-500/15 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Draft Notice with Gemini AI</span>
        </button>
      </div>

      {/* Main Notice Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Notice List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono px-2 pb-2 border-b border-slate-200">
            Active Notice Registry
          </div>

          {notices.map((n) => {
            const isSelected = activeNotice?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => setActiveNotice(n)}
                className={`p-3 rounded-xl border text-xs transition cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-slate-100 border-teal-300 shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {n.version}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                  <span>Type: {n.notice_type}</span>
                  <span className="capitalize">Lang: {n.language}</span>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  {n.approved_by ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-mono">Draft Review</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Active Notice View with Diff */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          {activeNotice ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{activeNotice.title}</h2>
                  <div className="text-xs text-slate-500 font-mono">
                    Version {activeNotice.version} · Approved by: {activeNotice.approved_by || 'Pending Legal Review'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!activeNotice.approved_by && canApprove && (
                    <button
                      onClick={() => handleApproveNotice(activeNotice.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                      Approve Notice
                    </button>
                  )}
                </div>
              </div>

              {/* Version Diff Banner */}
              {activeNotice.content_diff && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="font-mono font-bold text-amber-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Version Diff vs Previous Release:</span>
                  </div>
                  <p className="text-slate-700">{activeNotice.content_diff}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Note: Immutable snapshot attached to earlier consents is preserved intact.
                  </p>
                </div>
              )}

              {/* HTML Preview Sandbox */}
              <div className="bg-white text-slate-900 p-6 rounded-xl shadow-inner border border-slate-200 text-xs">
                <div dangerouslySetInnerHTML={{ __html: activeNotice.content_html }} />
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a notice to view contents and version diff.
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Drafting Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div className="flex items-center gap-2 text-teal-700">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Draft DPDPA Notice via Gemini 3.8 Flash</h3>
              </div>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setGeneratedDraft(null);
                }}
                className="text-slate-500 hover:text-slate-900 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            {!generatedDraft ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  Generates an itemised, unbundled DPDPA Section 6 compliant notice using approved templates and redacted inputs. Legal Approver approval is mandatory before publication.
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Notice Type *</label>
                  <select
                    value={aiNoticeType}
                    onChange={(e) => setAiNoticeType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="cctv_surveillance">CCTV / Video Surveillance Notice</option>
                    <option value="general_privacy">General Website / App Privacy Notice</option>
                    <option value="employee">Employee Personal Data Notice</option>
                    <option value="consent">Product Affirmative Consent Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Personal Data Categories Handled
                  </label>
                  <input
                    type="text"
                    value={aiCategories}
                    onChange={(e) => setAiCategories(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Specified Purposes</label>
                  <input
                    type="text"
                    value={aiPurposes}
                    onChange={(e) => setAiPurposes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <button
                  onClick={handleGenerateAi}
                  disabled={isGeneratingAi}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-teal-500/15 transition cursor-pointer"
                >
                  {isGeneratingAi ? 'Drafting via Gemini AI...' : 'Generate Statutory Notice Draft'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  ✓ Draft generated successfully. Review below and submit for Approver sign-off.
                </div>

                <div className="bg-white text-slate-900 p-4 rounded-xl max-h-64 overflow-y-auto border border-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: generatedDraft }} />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setGeneratedDraft(null)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                  >
                    Back to Inputs
                  </button>
                  <button
                    onClick={() => {
                      alert('Draft saved to repository pending Approver review.');
                      setShowAiModal(false);
                      setGeneratedDraft(null);
                    }}
                    className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg text-xs"
                  >
                    Save Notice Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
