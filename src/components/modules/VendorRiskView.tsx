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
} from 'lucide-react';

export const VendorRiskView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [vendors, setVendors] = useState<any[]>([]);

  const canApprove = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

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
          <span className="text-xs font-mono text-slate-500">Total Processors: {vendors.length}</span>
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
                        {v.risk_tier.replace('_', ' ')}
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
                    <td className="p-3 text-right space-x-2">
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
    </div>
  );
};
