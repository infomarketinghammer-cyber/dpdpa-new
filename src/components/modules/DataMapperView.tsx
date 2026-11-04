import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Shield,
  FileText,
  UserCheck,
} from 'lucide-react';

export const DataMapperView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [ropas, setRopas] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New RoPA Form
  const [purposeName, setPurposeName] = useState('');
  const [lawfulBasis, setLawfulBasis] = useState('consent');
  const [dataCategories, setDataCategories] = useState('Identifiers, Contact Details');
  const [retentionRationale, setRetentionRationale] = useState('Statutory 8 years or consent duration');
  const [safeguards, setSafeguards] = useState('AES-256 encryption, RBAC');
  const [manualAssetRef, setManualAssetRef] = useState('Core Production DB (Manual Reference)');

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [rList, pList, aList] = await Promise.all([
        apiFetch('/api/v1/mapper/ropa').catch(() => []),
        apiFetch('/api/v1/consent/purposes').catch(() => []),
        apiFetch('/api/v1/discovery/assets').catch(() => []),
      ]);
      setRopas(rList);
      setPurposes(pList);
      setAssets(aList);
    } catch (err) {
      console.error('Failed to load RoPA data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('data_mapper')) {
    return (
      <LockedModuleCard
        toolId="data_mapper"
        toolName="Data Mapper (RoPA & Legal Basis Matrix)"
        description="Comprehensive Record of Processing Activities under DPDPA Section 8(1), legal basis verification, safeguards, and Approver sign-off."
      />
    );
  }

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/api/v1/mapper/ropa/${id}/approve`, { method: 'POST' });
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to approve RoPA:', err);
    }
  };

  const handleCreateRoPA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/mapper/ropa', {
        method: 'POST',
        body: JSON.stringify({
          purpose_name: purposeName,
          lawful_basis: lawfulBasis,
          data_categories: dataCategories.split(',').map((s) => s.trim()),
          retention_rationale: retentionRationale,
          safeguards,
          manual_asset_refs: [manualAssetRef],
        }),
      });
      setShowCreateModal(false);
      setPurposeName('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to create RoPA record:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Purpose Name', 'Lawful Basis', 'Data Categories', 'Retention Rationale', 'Status', 'Approved By'];
    const rows = ropas.map((r) => [
      `"${r.purpose_name}"`,
      `"${r.lawful_basis}"`,
      `"${r.data_categories?.join(', ')}"`,
      `"${r.retention_rationale}"`,
      `"${r.approval_status}"`,
      `"${r.approved_by || 'Pending'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoPA_Register_${currentTenant?.legal_name || 'DPDPA'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
              DPDPA Section 8(1) · Record of Processing Activities
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>Record of Processing Activities (RoPA)</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Legal Basis Matrix and processing activity registry. Validates that every processing purpose is backed by verified affirmative consent or statutory mandate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add RoPA Entry</span>
          </button>
        </div>
      </div>

      {/* RoPA Table with Flagged Records */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Register of Processing Activities & Safeguards
          </h2>
          <div className="text-xs font-mono text-slate-500">
            Total Entries: {ropas.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Processing Purpose</th>
                <th className="p-3">Lawful Basis</th>
                <th className="p-3">Data Categories</th>
                <th className="p-3">Linked Assets / Fallback</th>
                <th className="p-3">Retention Rationale</th>
                <th className="p-3">Approval Gate</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ropas.map((r) => {
                const isDraft = r.approval_status !== 'approved';
                return (
                  <tr key={r.id} className={`hover:bg-slate-50 ${isDraft ? 'bg-amber-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.purpose_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Version: v{r.version}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] text-indigo-600 font-medium">
                        {r.lawful_basis}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {r.data_categories?.slice(0, 2).map((cat: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {r.linked_asset_ids?.length > 0 ? (
                        <span className="text-emerald-700">Linked Asset</span>
                      ) : (
                        <span className="text-amber-700">Manual Ref: {r.manual_asset_refs?.[0] || 'Reference'}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate" title={r.retention_rationale}>
                      {r.retention_rationale}
                    </td>
                    <td className="p-3">
                      {r.approval_status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Unapproved Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isDraft && canApprove && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono text-[11px] transition cursor-pointer"
                        >
                          Approve RoPA
                        </button>
                      )}
                      {r.approval_status === 'approved' && (
                        <span className="text-[10px] text-slate-400 font-mono">{r.approved_by?.split(' ')[0]}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create RoPA Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Create Record of Processing Activity</h3>

            <form onSubmit={handleCreateRoPA} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Purpose Name *</label>
                <input
                  type="text"
                  required
                  value={purposeName}
                  onChange={(e) => setPurposeName(e.target.value)}
                  placeholder="e.g., Merchant Risk Monitoring & Profiling"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Lawful Basis *</label>
                <select
                  value={lawfulBasis}
                  onChange={(e) => setLawfulBasis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="consent">Affirmative Consent (Section 6)</option>
                  <option value="statutory_compliance">Statutory Compliance (PMLA / RBI / Banking)</option>
                  <option value="certain_legitimate_uses_employment">Employment Purposes (Section 7)</option>
                  <option value="certain_legitimate_uses_medical_emergency">Medical Emergency (Section 7)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Data Categories</label>
                <input
                  type="text"
                  value={dataCategories}
                  onChange={(e) => setDataCategories(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Manual Asset / System Reference (Standalone Fallback)</label>
                <input
                  type="text"
                  value={manualAssetRef}
                  onChange={(e) => setManualAssetRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Retention Rationale</label>
                <input
                  type="text"
                  value={retentionRationale}
                  onChange={(e) => setRetentionRationale(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
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
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save RoPA Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
