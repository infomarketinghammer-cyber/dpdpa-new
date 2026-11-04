/**
 * AppContext: Multi-Tenant State, Role Permissions, Entitlements & SSE Sync
 * Product Requirements Document v1.0, March 2026
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Organisation,
  ToolEntitlement,
  UserRoleType,
  ToolModuleType,
  CPOHealthScore,
  ComplianceEvent,
} from '../types/index.ts';

export type AppNavTab =
  | 'cpo_dashboard'
  | 'consent_manager'
  | 'data_discovery'
  | 'data_mapper'
  | 'flow_mapper'
  | 'rights_manager'
  | 'vendor_manager'
  | 'policy_generator'
  | 'dpia'
  | 'risk_register'
  | 'automation'
  | 'breach_manager'
  | 'rules_engine'
  | 'audit_outbox'
  | 'board_report'
  | 'prd_traceability'
  | 'configured_env';

interface AppContextType {
  organisations: Organisation[];
  currentTenantId: string;
  currentTenant: Organisation | null;
  setCurrentTenantId: (id: string) => void;
  currentUserRole: UserRoleType;
  setCurrentUserRole: (role: UserRoleType) => void;
  currentUserId: string;
  currentUserName: string;
  entitlements: ToolEntitlement[];
  isEntitled: (tool: ToolModuleType) => boolean;
  healthScore: CPOHealthScore | null;
  syncLagSeconds: number;
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  notifications: ComplianceEvent[];
  clearNotifications: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
  refreshAll: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  showPublicPortal: boolean;
  setShowPublicPortal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [currentUserRole, setCurrentUserRole] = useState<UserRoleType>('admin');
  const [entitlements, setEntitlements] = useState<ToolEntitlement[]>([]);
  const [healthScore, setHealthScore] = useState<CPOHealthScore | null>(null);
  const [syncLagSeconds, setSyncLagSeconds] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<AppNavTab>('cpo_dashboard');
  const [notifications, setNotifications] = useState<ComplianceEvent[]>([]);
  const [showPublicPortal, setShowPublicPortal] = useState<boolean>(false);

  // Derived user details based on role
  const roleNameMap: Record<UserRoleType, { name: string; id: string }> = {
    ppoc_cpo: { name: 'Rajeshwar Rao (CPO/PPOC)', id: 'usr-1' },
    admin: { name: 'Sneha Patel (Privacy Admin)', id: 'usr-2' },
    approver: { name: 'Vikram Malhotra (Approver)', id: 'usr-3' },
    editor: { name: 'Priya Nair (Editor)', id: 'usr-4' },
    viewer: { name: 'Aarav Sharma (Auditor/Viewer)', id: 'usr-5' },
  };

  const currentUserId = roleNameMap[currentUserRole].id;
  const currentUserName = roleNameMap[currentUserRole].name;

  const currentTenant = organisations.find((o) => o.id === currentTenantId) || null;

  // Custom authenticated API fetch wrapper
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('x-tenant-id', currentTenantId);
      headers.set('x-user-role', currentUserRole);
      headers.set('x-user-id', currentUserId);
      headers.set('x-user-name', currentUserName);
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw errorData;
      }
      return res.json();
    },
    [currentTenantId, currentUserRole, currentUserId, currentUserName]
  );

  const isEntitled = useCallback(
    (tool: ToolModuleType) => {
      return entitlements.some((e) => e.tool_id === tool && e.is_licensed);
    },
    [entitlements]
  );

  const refreshAll = useCallback(async () => {
    try {
      const [orgs, ents, health] = await Promise.all([
        apiFetch('/api/v1/organisations'),
        apiFetch('/api/v1/entitlements'),
        apiFetch('/api/v1/cpo/health'),
      ]);
      setOrganisations(orgs);
      setEntitlements(ents);
      setHealthScore(health);
      setSyncLagSeconds(health.sync_lag_seconds || 0);
    } catch (err) {
      console.error('Failed to load initial compliance state:', err);
    }
  }, [apiFetch]);

  const resetDemoData = useCallback(async () => {
    try {
      await apiFetch('/api/v1/demo/reset', { method: 'POST' });
      await refreshAll();
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    }
  }, [apiFetch, refreshAll]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Server-Sent Events (SSE) listener for real-time compliance events
  useEffect(() => {
    const sse = new EventSource(`/api/v1/events/stream?tenant_id=${currentTenantId}`);

    sse.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event_type) {
          setNotifications((prev) => [parsed, ...prev.slice(0, 19)]);
          // Refresh health score on state mutations
          apiFetch('/api/v1/cpo/health')
            .then(setHealthScore)
            .catch(() => {});
        }
      } catch (e) {
        // ignore handshake or malformed
      }
    };

    sse.onerror = () => {
      // simulate lag increase if disconnected
      setSyncLagSeconds((prev) => prev + 5);
    };

    return () => {
      sse.close();
    };
  }, [currentTenantId, apiFetch]);

  const clearNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider
      value={{
        organisations,
        currentTenantId,
        currentTenant,
        setCurrentTenantId,
        currentUserRole,
        setCurrentUserRole,
        currentUserId,
        currentUserName,
        entitlements,
        isEntitled,
        healthScore,
        syncLagSeconds,
        activeTab,
        setActiveTab,
        notifications,
        clearNotifications,
        apiFetch,
        refreshAll,
        resetDemoData,
        showPublicPortal,
        setShowPublicPortal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
