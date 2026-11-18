import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  Building,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Pencil,
  X,
} from 'lucide-react';

type VendorForm = {
  legal_name: string;
  contact_email: string;
  services_provided: string;
  risk_tier: string;
  hosting_geography: string;
  subprocessors: string;
  security_score: string;
  dpa_status: string;
  dpa_signed_at: string;
  dpa_expires_at: string;
};

const EMPTY_FORM: VendorForm = {
  legal_name: '',
  contact_email: '',
  services_provided: '',
  risk_tier: 'tier_2_medium',
  hosting_geography: 'India',
  subprocessors: '',
  security_score: '0',
  dpa_status: 'missing',
  dpa_signed_at: '',
  dpa_expires_at: '',
};

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

const inputCls = 'w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900';
const labelCls = 'block text-xs font-mono text-slate-500 mb-1';

export const VendorRiskView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [vendors, setVendors] = useState<any[]>([]);

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);
  const canEdit = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  // Add / edit modal state (editingId === null means "add new")
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/vendor/vendors');
      setVendors(list);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('vendor_manager')) {
    return (
      <LockedModuleCard
        toolId="vendor_manager"
        toolName="Vendor Risk Manager & DPAs"
        description="5-stage vendor onboarding workflow, Data Processing Agreement (DPA) tracking, subprocessor registers, and automated renewal triggers."
      />
    );
  }

  const handleAdvanceStage = async (id: string, nextStage: string) => {
    try {
      await apiFetch(`/api/v1/vendor/vendors/${id}/advance-stage`, {
        method: 'POST',
        body: JSON.stringify({ stage: nextStage }),
      });
      await loadData();
      await refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to advance stage');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      legal_name: v.legal_name || '',
      contact_email: v.contact_email || '',
      services_provided: v.services_provided || '',
      risk_tier: v.risk_tier || 'tier_2_medium',
      hosting_geography: v.hosting_geography || '',
      subprocessors: (v.subprocessors || []).join(', '),
      security_score: String(v.security_score ?? 0),
      dpa_status: v.dpa_status || 'missing',
      dpa_signed_at: toDateInput(v.dpa_signed_at),
      dpa_expires_at: toDateInput(v.dpa_expires_at),
    });
    setFormError('');
    setShowModal(true);
  };

  const setField =
    (key: keyof VendorForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.dpa_signed_at && form.dpa_expires_at && form.dpa_expires_at <= form.dpa_signed_at) {
      setFormError('DPA expiry date must be after the signed date.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, security_score: Number(form.security_score) };
      await apiFetch(editingId ? `/api/v1/vendor/vendors/${editingId}` : '/api/v1/vendor/vendors', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      await loadData();
      await refreshAll();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-700">
              DPDPA Section 8(2) · Data Processor & Vendor Governance
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-amber-700" />
            <span>Vendor Risk & Data Processor Agreements (DPAs)</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Enforces 5-stage onboarding pipeline: Registration, Security Assessment, DPA Contract Execution, Legal Review, and Approval Gates. Automates DPA expiration alerts and renewal tasks.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Weight in CPO Health Score: <strong className="text-amber-700">15%</strong>
        </div>
      </div>

      {/* 5-Stage Visual Workflow Pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          5-Stage Processor Onboarding Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {['registration', 'assessment', 'dpa_workflow', 'review', 'approved'].map((stage, idx) => {
            const count = vendors.filter((v) => v.onboarding_stage === stage).length;
            const labels: Record<string, string> = {
              registration: '1. Registration',
              assessment: '2. Due Diligence',
              dpa_workflow: '3. DPA Contract',
              review: '4. Legal Review',
              approved: '5. Approved Gate',
            };
            return (
              <div key={stage} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase">{labels[stage]}</div>
                <div className="text-xl font-black text-slate-900">{count}</div>
                <div className="text-[10px] text-slate-400">Vendors in stage</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Vendor Directory & DPA Contract Status
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">Total Processors: {vendors.length}</span>
            {canEdit && (
              <button
                onClick={openAdd}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Vendor
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Vendor / Processor</th>
                <th className="p-3">Services Provided</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3">Hosting Geography</th>
                <th className="p-3">DPA Status</th>
                <th className="p-3">Stage</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vendors.map((v) => {
                const isExpired = v.dpa_status === 'expired';
                return (
                  <tr key={v.id} className={`hover:bg-slate-50 ${isExpired ? 'bg-rose-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{v.legal_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.contact_email}</div>
                    </td>
                    <td className="p-3 text-slate-700 max-w-xs truncate" title={v.services_provided}>
                      {v.services_provided}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                        {String(v.risk_tier || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{v.hosting_geography}</td>
                    <td className="p-3 font-mono">
                      {v.dpa_status === 'signed' ? (
                        <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active DPA
                        </span>
                      ) : v.dpa_status === 'expired' ? (
                        <span className="text-rose-600 flex items-center gap-1 text-[11px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED (Renewal Alert)
                        </span>
                      ) : (
                        <span className="text-amber-700 text-[11px]">Missing / Draft</span>
                      )}
                    </td>
                    <td className="p-3 font-mono uppercase text-slate-700 text-[11px]">
                      {v.onboarding_stage.replace('_', ' ')}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(v)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-mono text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                      {v.onboarding_stage !== 'approved' && (
                        <button
                          onClick={() => {
                            const nextMap: Record<string, string> = {
                              registration: 'assessment',
                              assessment: 'dpa_workflow',
                              dpa_workflow: 'review',
                              review: 'approved',
                            };
                            handleAdvanceStage(v.id, nextMap[v.onboarding_stage]);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-[11px] transition cursor-pointer"
                        >
                          Advance Stage
                        </button>
                      )}
                      {v.onboarding_stage === 'approved' && (
                        <span className="text-emerald-700 font-mono text-[11px]">Authorized</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? 'Edit Vendor Details' : 'Add New Vendor / Processor'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Vendor Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={form.legal_name}
                    onChange={setField('legal_name')}
                    placeholder="e.g., Acme Cloud Services Pvt Ltd"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={setField('contact_email')}
                    placeholder="privacy@vendor.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Hosting Geography</label>
                  <input
                    type="text"
                    value={form.hosting_geography}
                    onChange={setField('hosting_geography')}
                    placeholder="e.g., India (Mumbai)"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Services Provided</label>
                  <textarea
                    rows={2}
                    value={form.services_provided}
                    onChange={setField('services_provided')}
                    placeholder="What personal data processing does this vendor perform?"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Risk Tier</label>
                  <select value={form.risk_tier} onChange={setField('risk_tier')} className={inputCls}>
                    <option value="tier_1_high">Tier 1 · High</option>
                    <option value="tier_2_medium">Tier 2 · Medium</option>
                    <option value="tier_3_low">Tier 3 · Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Security Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.security_score}
                    onChange={setField('security_score')}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Sub-processors (comma separated)</label>
                  <input
                    type="text"
                    value={form.subprocessors}
                    onChange={setField('subprocessors')}
                    placeholder="e.g., AWS, Twilio"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>DPA Status</label>
                  <select value={form.dpa_status} onChange={setField('dpa_status')} className={inputCls}>
                    <option value="missing">Missing</option>
                    <option value="draft">Draft</option>
                    <option value="signed">Signed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="hidden sm:block" />
                <div>
                  <label className={labelCls}>DPA Signed Date</label>
                  <input type="date" value={form.dpa_signed_at} onChange={setField('dpa_signed_at')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>DPA Expiry Date</label>
                  <input type="date" value={form.dpa_expires_at} onChange={setField('dpa_expires_at')} className={inputCls} />
                </div>
              </div>

              {formError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
