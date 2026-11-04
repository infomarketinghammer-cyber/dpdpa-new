import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ToolModuleType } from '../../types/index.ts';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface LockedModuleCardProps {
  toolId: ToolModuleType;
  toolName: string;
  description: string;
}

export const LockedModuleCard: React.FC<LockedModuleCardProps> = ({
  toolId,
  toolName,
  description,
}) => {
  const { currentTenant, currentUserRole, apiFetch, refreshAll, setActiveTab } = useApp();
  const [isEnabling, setIsEnabling] = useState(false);

  const canManageLicenses = ['admin', 'ppoc_cpo'].includes(currentUserRole);

  const handleEnableLicense = async () => {
    setIsEnabling(true);
    try {
      await apiFetch('/api/v1/entitlements/toggle', {
        method: 'POST',
        body: JSON.stringify({ tool_id: toolId, is_licensed: true }),
      });
      await refreshAll();
    } catch (err) {
      console.error('Failed to toggle entitlement:', err);
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-4 sm:my-12 p-5 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-mono mb-3">
        Not Included in Your Plan
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{toolName} is Not Licensed</h2>
      <p className="text-slate-500 text-sm max-w-xl mx-auto mb-6">
        {description} Your current organisation (<span className="text-slate-900 font-medium">{currentTenant?.legal_name}</span>) does not currently have this module enabled.
      </p>

      {/* Standalone Fallback & Reconciliation Accordion */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left mb-8 space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Works without this module
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Each module also works on its own. For example, if you are fulfilling Data Principal Rights or Consent without purchasing <span className="text-indigo-600 font-medium">{toolName}</span>, you can still enter systems and data sources manually in the modules you use.
        </p>
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Your existing records are linked automatically once this module is activated.</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
        {canManageLicenses ? (
          <button
            onClick={handleEnableLicense}
            disabled={isEnabling}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEnabling ? 'Activating...' : 'Activate Module'}</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400">
            Contact your Privacy Admin or CPO to toggle this tool entitlement.
          </div>
        )}

        <button
          onClick={() => setActiveTab('rights_manager')}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl border border-slate-300 transition cursor-pointer"
        >
          <span>Jump to Standalone Rights Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
