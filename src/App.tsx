/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { CPODashboardView } from './components/modules/CPODashboardView.tsx';
import { BoardReadinessReportView } from './components/modules/BoardReadinessReportView.tsx';
import { ConsentManagerView } from './components/modules/ConsentManagerView.tsx';
import { DataDiscoveryView } from './components/modules/DataDiscoveryView.tsx';
import { DataMapperView } from './components/modules/DataMapperView.tsx';
import { FlowMapperView } from './components/modules/FlowMapperView.tsx';
import { RightsManagerView } from './components/modules/RightsManagerView.tsx';
import { VendorRiskView } from './components/modules/VendorRiskView.tsx';
import { PolicyGeneratorView } from './components/modules/PolicyGeneratorView.tsx';
import { DPIAView } from './components/modules/DPIAView.tsx';
import { RiskRegisterView } from './components/modules/RiskRegisterView.tsx';
import { ComplianceAutomationView } from './components/modules/ComplianceAutomationView.tsx';
import { BreachManagerView } from './components/modules/BreachManagerView.tsx';
import { RegulatoryRulesView } from './components/modules/RegulatoryRulesView.tsx';
import { AuditAndOutboxView } from './components/modules/AuditAndOutboxView.tsx';
import { PublicPortalModal } from './components/modules/PublicPortalModal.tsx';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll workspace back to top whenever the module changes
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Lock background scroll while the mobile drawer is open; close it with Escape
  useEffect(() => {
    if (!isNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isNavOpen]);

  return (
    <div className="h-dvh bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-200 selection:text-indigo-950">
      {/* Top Header */}
      <Header isNavOpen={isNavOpen} onToggleNav={() => setIsNavOpen((v) => !v)} />

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar (off-canvas drawer below lg) */}
        <Sidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

        {/* Center Main Workspace */}
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'cpo_dashboard' && <CPODashboardView />}
            {activeTab === 'board_report' && <BoardReadinessReportView />}
            {activeTab === 'consent_manager' && <ConsentManagerView />}
            {activeTab === 'data_discovery' && <DataDiscoveryView />}
            {activeTab === 'data_mapper' && <DataMapperView />}
            {activeTab === 'flow_mapper' && <FlowMapperView />}
            {activeTab === 'rights_manager' && <RightsManagerView />}
            {activeTab === 'vendor_manager' && <VendorRiskView />}
            {activeTab === 'policy_generator' && <PolicyGeneratorView />}
            {activeTab === 'dpia' && <DPIAView />}
            {activeTab === 'risk_register' && <RiskRegisterView />}
            {activeTab === 'automation' && <ComplianceAutomationView />}
            {activeTab === 'breach_manager' && <BreachManagerView />}
            {activeTab === 'rules_engine' && <RegulatoryRulesView />}
            {activeTab === 'audit_outbox' && <AuditAndOutboxView />}
          </div>
        </main>
      </div>

      {/* Embeddable Public Data Principal Portal Modal */}
      <PublicPortalModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
