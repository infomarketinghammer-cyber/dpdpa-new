import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

export const DPIAView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [dpias, setDpias] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard state
  const [title, setTitle] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [screeningOutcome, setScreeningOutcome] = useState('dpia_required');
  const [processingContext, setProcessingContext] = useState('');
  const [necessityRationale, setNecessityRationale] = useState('');
  const [residualRisk, setResidualRisk] = useState<'high' | 'medium' | 'low'>('medium');

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/dpia/assessments');
      setDpias(list);
    } catch (err) {
      console.error('Failed to load DPIA assessments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('dpia')) {
    return (
      <LockedModuleCard
        toolId="dpia"
        toolName="Data Protection Impact Assessment (DPIA)"
        description="6-step statutory risk assessment for Significant Data Fiduciaries (Section 10(2)(c)), necessity tests, and automated Risk Register sync."
      />
    );
  }

  const handleCreateDPIA = async () => {
    try {
      await apiFetch('/api/v1/dpia/assessments', {
        method: 'POST',
        body: JSON.stringify({
          title,
          project_scope: projectScope,
          screening_outcome: screeningOutcome,
          processing_context: processingContext,
          necessity_rationale: necessityRationale,
          residual_risk_level: residualRisk,
        }),
      });
      setShowWizard(false);
      setWizardStep(1);
      setTitle('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to create DPIA:', err);
    }
  };

  const handleApproveDPIA = async (id: string) => {
    try {
      await apiFetch(`/api/v1/dpia/assessments/${id}/approve`, { method: 'POST' });
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to approve DPIA:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-600">
              DPDPA Section 10(2)(c) · Significant Data Fiduciary Mandate
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-rose-600" />
            <span>Data Protection Impact Assessment (DPIA)</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Conduct 6-step statutory evaluations for high-risk processing, algorithmic profiling, and biometric deployments. Approved findings automatically route to the Risk Register.
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/15 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Initiate 6-Step DPIA Wizard</span>
        </button>
      </div>

      {/* DPIA Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dpias.map((d) => (
          <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-sm">{d.title}</span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Version v{d.version}
              </span>
            </div>

            <p className="text-slate-500 leading-relaxed">{d.project_scope}</p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
              <div>Screening: <strong className="text-slate-900">{d.screening_outcome}</strong></div>
              <div>Residual Risk: <strong className={d.residual_risk_level === 'high' ? 'text-rose-600' : 'text-amber-700'}>{d.residual_risk_level.toUpperCase()}</strong></div>
              <div>Necessity: <span className="text-slate-700">{d.necessity_rationale}</span></div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-200 gap-2">
              <div>
                {d.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {d.approved_by}
                  </span>
                ) : (
                  <span className="text-amber-700 font-mono text-[10px]">In Review</span>
                )}
              </div>

              {d.status !== 'approved' && canApprove && (
                <button
                  onClick={() => handleApproveDPIA(d.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono text-[11px] transition cursor-pointer"
                >
                  Approve & Ingest Risk
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 6-Step Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <span className="text-xs font-mono text-rose-600">Step {wizardStep} of 6</span>
                <h3 className="font-bold text-base text-slate-900">DPIA Statutory Assessment Wizard</h3>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-500 hover:text-slate-900 text-xs font-mono">
                [CLOSE]
              </button>
            </div>

            {/* Steps Content */}
            {wizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 1: Project Scope & Preliminary Screening</div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Credit Bureau Automated Profiling Engine"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Project Scope & Data Volume *</label>
                  <textarea
                    rows={2}
                    value={projectScope}
                    onChange={(e) => setProjectScope(e.target.value)}
                    placeholder="Scope of personal data processing..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 2: Processing Context & Data Principal Categories</div>
                <p className="text-slate-500">Specify categories of individuals impacted and their reasonable expectations.</p>
                <textarea
                  rows={3}
                  value={processingContext}
                  onChange={(e) => setProcessingContext(e.target.value)}
                  placeholder="e.g., Affects sole-proprietor merchants applying for unsecured working capital..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 3: Necessity & Proportionality Test</div>
                <p className="text-slate-500">Can the specified business objective be achieved with less intrusive measures?</p>
                <textarea
                  rows={3}
                  value={necessityRationale}
                  onChange={(e) => setNecessityRationale(e.target.value)}
                  placeholder="Necessity rationale under DPDPA..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 4: Risk Analysis & Potential Harm to Principals</div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  Assess likelihood of unfair discrimination, unauthorized financial disclosure, or loss of control over personal data.
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 5: Mitigations & Residual Risk Level</div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Residual Risk Level</label>
                  <select
                    value={residualRisk}
                    onChange={(e) => setResidualRisk(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="low">Low Residual Risk</option>
                    <option value="medium">Medium Residual Risk</option>
                    <option value="high">High Residual Risk (Requires DPO Sign-off)</option>
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-800">Step 6: Review & Final Submission</div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div>Title: <strong>{title || 'Untitled Assessment'}</strong></div>
                  <div>Residual Risk: <strong className="text-amber-700">{residualRisk.toUpperCase()}</strong></div>
                  <div>Outcome: <strong className="text-emerald-700">DPIA Complete</strong></div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 gap-2">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(wizardStep - 1)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs disabled:opacity-40"
              >
                Previous
              </button>

              {wizardStep < 6 ? (
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleCreateDPIA}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Assessment Draft
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
