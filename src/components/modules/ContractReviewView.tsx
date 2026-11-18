import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  FileSearch,
  UploadCloud,
  FileText,
  Trash2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types shared with the future analysis API
// ----------------------------------------------------------------------------
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ContractIssue {
  id: string;
  severity: IssueSeverity;
  category: string;
  title: string;
  description: string;
  clause_reference?: string; // e.g. "Clause 7.2" or a quoted excerpt
  recommendation?: string;
}

type ReviewStatus = 'uploaded' | 'analyzing' | 'completed' | 'failed';

interface ContractReview {
  id: string;
  file: File;
  file_name: string;
  file_size: number;
  contract_type: string;
  counterparty: string;
  uploaded_at: string;
  status: ReviewStatus;
  issues: ContractIssue[];
  error?: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];
const MAX_FILE_SIZE_MB = 15;

const CONTRACT_TYPES = [
  'Data Processing Agreement (DPA)',
  'Vendor / Service Agreement',
  'Master Services Agreement (MSA)',
  'Non-Disclosure Agreement (NDA)',
  'Employment Contract',
  'Data Sharing Agreement',
  'Other',
];

// Areas the analysis will check (shown before results are available)
const REVIEW_CHECKLIST = [
  'Purpose limitation & lawful processing instructions',
  'Reasonable security safeguards (Sec 8(5))',
  'Personal data breach notification obligations',
  'Sub-processor engagement & flow-down terms',
  'Data retention, return & erasure on termination',
  'Cross-border transfer restrictions',
  'Audit, inspection & cooperation rights',
  'Liability, indemnity & penalty allocation',
];

const SEVERITY_STYLES: Record<IssueSeverity, { badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { badge: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertOctagon },
  high: { badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  medium: { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  low: { badge: 'bg-sky-100 text-sky-700 border-sky-200', icon: Info },
};

/**
 * Placeholder for the contract analysis backend.
 * TODO: replace with the real API call (e.g. POST /api/v1/contracts/analyze with
 * multipart form data) and return the flagged issues.
 */
async function analyzeContract(_review: ContractReview): Promise<ContractIssue[]> {
  throw new Error('ANALYSIS_NOT_CONNECTED');
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const inputCls = 'w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900';
const labelCls = 'block text-xs font-mono text-slate-500 mb-1';

export const ContractReviewView: React.FC = () => {
  const { currentTenant, currentUserRole } = useApp();
  const canUpload = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<ContractReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Pending upload form
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [counterparty, setCounterparty] = useState('');
  const [uploadError, setUploadError] = useState('');

  const selected = reviews.find((r) => r.id === selectedId) || null;

  const pickFile = (file: File | undefined) => {
    setUploadError('');
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setUploadError(`Unsupported file type. Please upload ${ACCEPTED_EXTENSIONS.join(', ')}.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File is larger than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setPendingFile(file);
  };

  const updateReview = (id: string, patch: Partial<ContractReview>) =>
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const runAnalysis = async (review: ContractReview) => {
    updateReview(review.id, { status: 'analyzing', error: undefined });
    try {
      const issues = await analyzeContract(review);
      updateReview(review.id, { status: 'completed', issues });
    } catch (err: any) {
      updateReview(review.id, {
        status: err?.message === 'ANALYSIS_NOT_CONNECTED' ? 'uploaded' : 'failed',
        error:
          err?.message === 'ANALYSIS_NOT_CONNECTED'
            ? 'The contract analysis engine is not connected yet. Issues will be flagged here once it is enabled.'
            : err?.message || 'Analysis failed',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) return;
    const review: ContractReview = {
      id: `cr-${crypto.randomUUID()}`,
      file: pendingFile,
      file_name: pendingFile.name,
      file_size: pendingFile.size,
      contract_type: contractType,
      counterparty: counterparty.trim(),
      uploaded_at: new Date().toISOString(),
      status: 'uploaded',
      issues: [],
    };
    setReviews((list) => [review, ...list]);
    setSelectedId(review.id);
    setPendingFile(null);
    setCounterparty('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    runAnalysis(review);
  };

  const removeReview = (id: string) => {
    setReviews((list) => list.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const counts = (r: ContractReview) =>
    (['critical', 'high', 'medium', 'low'] as IssueSeverity[]).map((s) => ({
      severity: s,
      count: r.issues.filter((i) => i.severity === s).length,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-violet-700">
            DPDPA Section 8 · Contractual Safeguards
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileSearch className="w-6 h-6 text-violet-700" />
          <span>Contract Review</span>
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl mt-1">
          Upload a contract (DPA, vendor agreement, NDA, etc.) to have it reviewed for DPDPA compliance gaps. Flagged
          issues are grouped by severity with clause references and recommended fixes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upload + list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Upload Contract</h2>

            {!canUpload ? (
              <p className="text-xs text-slate-500">
                Your current role ({currentUserRole}) can view reviews but cannot upload contracts.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-violet-400 bg-slate-50'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-violet-600 mb-2" />
                  {pendingFile ? (
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 break-all">{pendingFile.name}</div>
                      <div className="text-slate-500 font-mono">{formatSize(pendingFile.size)}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-violet-700">Click to choose</span> or drag & drop a file
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        PDF, DOCX, DOC, TXT · max {MAX_FILE_SIZE_MB} MB
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </div>

                <div>
                  <label className={labelCls}>Contract Type</label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputCls}>
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Counterparty (optional)</label>
                  <input
                    type="text"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder="e.g., Acme Cloud Services Pvt Ltd"
                    className={inputCls}
                  />
                </div>

                {uploadError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {uploadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!pendingFile}
                  className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Upload & Review
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Reviewed Contracts</h2>
              <span className="text-xs font-mono text-slate-500">{reviews.length}</span>
            </div>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No contracts uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        selectedId === r.id
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 truncate">{r.file_name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {r.contract_type}
                          {r.counterparty ? ` · ${r.counterparty}` : ''}
                        </div>
                      </div>
                      <StatusPill review={r} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Review results */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 min-h-[320px]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-500">
                <FileSearch className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">No contract selected</p>
                <p className="text-xs mt-1">Upload a contract or pick one from the list to see flagged issues.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 break-all">{selected.file_name}</h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {selected.contract_type}
                      {selected.counterparty ? ` · ${selected.counterparty}` : ''} · {formatSize(selected.file_size)} ·
                      Uploaded {new Date(selected.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpload && selected.status !== 'analyzing' && (
                      <button
                        onClick={() => runAnalysis(selected)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-mono text-[11px] cursor-pointer"
                      >
                        {selected.status === 'completed' ? 'Re-run Review' : 'Run Review'}
                      </button>
                    )}
                    <button
                      onClick={() => removeReview(selected.id)}
                      className="p-1.5 border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                      aria-label="Remove contract"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Severity summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {counts(selected).map(({ severity, count }) => (
                    <div
                      key={severity}
                      className={`rounded-xl border px-3 py-2.5 ${SEVERITY_STYLES[severity].badge}`}
                    >
                      <div className="text-[10px] font-mono uppercase">{severity}</div>
                      <div className="text-xl font-black">
                        {selected.status === 'completed' ? count : '—'}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.status === 'analyzing' && (
                  <div className="flex items-center gap-2 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reviewing contract…
                  </div>
                )}

                {selected.error && selected.status !== 'analyzing' && (
                  <div
                    className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 border ${
                      selected.status === 'failed'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {selected.status === 'failed' ? (
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{selected.error}</span>
                  </div>
                )}

                {/* Flagged issues */}
                {selected.status === 'completed' ? (
                  selected.issues.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4" /> No issues flagged in this contract.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Flagged Issues ({selected.issues.length})
                      </h3>
                      {selected.issues.map((issue) => {
                        const style = SEVERITY_STYLES[issue.severity];
                        const Icon = style.icon;
                        return (
                          <div key={issue.id} className="border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${style.badge}`}
                              >
                                <Icon className="w-3 h-3" /> {issue.severity}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">{issue.category}</span>
                              {issue.clause_reference && (
                                <span className="text-[11px] font-mono text-slate-400">· {issue.clause_reference}</span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-900">{issue.title}</div>
                            <p className="text-xs text-slate-600">{issue.description}</p>
                            {issue.recommendation && (
                              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Review Checklist
                    </h3>
                    <p className="text-xs text-slate-500">The review will check the contract against these areas:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REVIEW_CHECKLIST.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ review: ContractReview }> = ({ review }) => {
  const map: Record<ReviewStatus, { label: string; cls: string }> = {
    uploaded: { label: 'Pending', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    analyzing: { label: 'Reviewing', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
    completed: {
      label: `${review.issues.length} issue${review.issues.length === 1 ? '' : 's'}`,
      cls:
        review.issues.length > 0
          ? 'bg-rose-100 text-rose-700 border-rose-200'
          : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    failed: { label: 'Failed', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  };
  const s = map[review.status];
  return <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${s.cls}`}>{s.label}</span>;
};
