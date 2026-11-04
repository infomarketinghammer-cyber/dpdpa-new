import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  GitFork,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Filter,
  Plus,
  Server,
  Layers,
} from 'lucide-react';

export const FlowMapperView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [flows, setFlows] = useState<any[]>([]);
  const [filterCrossBorderOnly, setFilterCrossBorderOnly] = useState(false);
  const [showAddFlow, setShowAddFlow] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sourceEntity, setSourceEntity] = useState('Core Production DB');
  const [destEntity, setDestEntity] = useState('Zendesk Cloud (US Region)');
  const [purposeName, setPurposeName] = useState('Customer Grievance & Support');
  const [isCrossBorder, setIsCrossBorder] = useState(true);
  const [safeguards, setSafeguards] = useState('TLS 1.3 encryption; DPA review pending');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('high');

  const loadData = async () => {
    try {
      const list = await apiFetch('/api/v1/flow-mapper/flows');
      setFlows(list);
    } catch (err) {
      console.error('Failed to load data flows:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('flow_mapper')) {
    return (
      <LockedModuleCard
        toolId="flow_mapper"
        toolName="Data Flow Mapper"
        description="Directed transfer diagram, cross-border transmission governance (Section 16), and missing safeguard risk detection."
      />
    );
  }

  const handleAddFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/flow-mapper/flows', {
        method: 'POST',
        body: JSON.stringify({
          name,
          source_entity: sourceEntity,
          destination_entity: destEntity,
          purpose_name: purposeName,
          is_cross_border: isCrossBorder,
          destination_geography: isCrossBorder ? 'International (US / EU)' : 'India (Domestic)',
          safeguards,
          risk_level: riskLevel,
        }),
      });
      setShowAddFlow(false);
      setName('');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to create data flow:', err);
    }
  };

  const filteredFlows = filterCrossBorderOnly
    ? flows.filter((f) => f.is_cross_border)
    : flows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-600">
              DPDPA Section 16 · Cross-Border Data Flow Matrix
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitFork className="w-6 h-6 text-purple-600" />
            <span>Data Flow Mapper & Geolocation Governance</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Directed graph of source-to-destination transfers across systems, teams, and cloud services. Automatically flags missing safeguards and cross-border risks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterCrossBorderOnly(!filterCrossBorderOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-mono transition cursor-pointer ${
              filterCrossBorderOnly
                ? 'bg-purple-600 border-purple-500 text-white font-bold'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cross-Border Transfers Only ({flows.filter((f) => f.is_cross_border).length})</span>
          </button>

          <button
            onClick={() => setShowAddFlow(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Transfer Edge</span>
          </button>
        </div>
      </div>

      {/* Visual Flow Topology Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Directed Transfer Topology Map</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {filteredFlows.map((flow) => {
            const isHighRisk = flow.risk_level === 'high' || flow.risk_level === 'critical';
            return (
              <div
                key={flow.id}
                className={`bg-slate-50 p-4 rounded-xl border relative overflow-hidden text-xs space-y-3 ${
                  isHighRisk ? 'border-rose-300 shadow-lg shadow-rose-500/15' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{flow.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                      isHighRisk
                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {flow.risk_level} Risk
                  </span>
                </div>

                {/* Nodes & Arrow */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-mono text-[11px]">
                    <Server className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span className="truncate">{flow.source_entity}</span>
                  </div>

                  <div className="flex items-center justify-center text-slate-400 py-0.5">
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                  </div>

                  <div className="flex items-center gap-2 text-sky-700 font-mono text-[11px]">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                    <span className="truncate">{flow.destination_entity}</span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-500 text-[11px]">
                  <div>
                    Destination:{' '}
                    <strong className="text-slate-900 font-mono">{flow.destination_geography}</strong>
                  </div>
                  <div>
                    Transfer Mechanism:{' '}
                    <span className="text-slate-700">{flow.transfer_mechanism}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 text-[10px]">
                    Safeguards:{' '}
                    <span className={isHighRisk ? 'text-amber-700' : 'text-slate-500'}>
                      {flow.safeguards}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Flow Modal */}
      {showAddFlow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Register Data Flow Edge</h3>

            <form onSubmit={handleAddFlow} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Flow Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Fraud Analytics Stream"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Source Node *</label>
                  <input
                    type="text"
                    required
                    value={sourceEntity}
                    onChange={(e) => setSourceEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Destination Node *</label>
                  <input
                    type="text"
                    required
                    value={destEntity}
                    onChange={(e) => setDestEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Purpose Name</label>
                <input
                  type="text"
                  value={purposeName}
                  onChange={(e) => setPurposeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCrossBorder}
                      onChange={(e) => setIsCrossBorder(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-800">Cross-Border Transfer</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Missing Safeguards)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Safeguards & Encryption</label>
                <input
                  type="text"
                  value={safeguards}
                  onChange={(e) => setSafeguards(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFlow(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Flow Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
