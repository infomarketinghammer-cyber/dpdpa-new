import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserRoleType } from '../types/index.ts';
import {
  Building2,
  ShieldCheck,
  Bell,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  isNavOpen: boolean;
  onToggleNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isNavOpen, onToggleNav }) => {
  const {
    organisations,
    currentTenantId,
    setCurrentTenantId,
    currentTenant,
    currentUserRole,
    setCurrentUserRole,
    notifications,
    clearNotifications,
    resetDemoData,
    setShowPublicPortal,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close the notification popover when clicking outside of it
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const handleReset = async () => {
    if (confirm('Reset all records back to the original sample data?')) {
      setIsResetting(true);
      await resetDemoData();
      setIsResetting(false);
    }
  };

  const isMfaRole = ['approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 z-40 select-none shrink-0">
      {/* Primary Navigation Bar */}
      <div className="px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
        {/* Mobile nav toggle */}
        <button
          onClick={onToggleNav}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          aria-label={isNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isNavOpen}
        >
          {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0 flex-1 2xl:flex-none">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 truncate">
                DPDPA Privacy Suite
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 font-sans truncate">
              Indian Fiduciary Privacy Operations & Regulatory Compliance
            </p>
          </div>
        </div>

        {/* Tenant & Role Switchers — full-width second row below lg */}
        <div className="order-last w-full grid grid-cols-1 sm:grid-cols-2 gap-2 2xl:order-none 2xl:w-auto 2xl:flex 2xl:items-center 2xl:gap-3 2xl:mx-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs min-w-0">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Organisation
              </span>
              <select
                value={currentTenantId}
                onChange={(e) => setCurrentTenantId(e.target.value)}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-2 text-xs w-full truncate"
              >
                {organisations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-white text-slate-900">
                    {org.dba_name || org.legal_name} {org.is_significant_data_fiduciary ? '(SDF)' : '(FPO)'}
                  </option>
                ))}
              </select>
            </div>
            {currentTenant?.is_significant_data_fiduciary && (
              <span className="ml-1 shrink-0 bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                SEC 10 SDF
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Active Role
                </span>
                {isMfaRole ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 font-mono">
                    <CheckCircle2 className="w-2.5 h-2.5" /> MFA OK
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono">Standard</span>
                )}
              </div>
              <select
                value={currentUserRole}
                onChange={(e) => setCurrentUserRole(e.target.value as UserRoleType)}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-2 text-xs w-full truncate"
              >
                <option value="ppoc_cpo" className="bg-white text-slate-900">PPOC / CPO (Section 8(5))</option>
                <option value="admin" className="bg-white text-slate-900">Privacy Admin (Full Config)</option>
                <option value="approver" className="bg-white text-slate-900">Legal Approver (Sign-offs)</option>
                <option value="editor" className="bg-white text-slate-900">Editor (Drafts Only)</option>
                <option value="viewer" className="bg-white text-slate-900">Auditor / Viewer (Read-only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPublicPortal(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            title="Open embeddable mobile-friendly Data Principal Preference & Rights Portal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Portal</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg transition cursor-pointer"
            title="Reset all records back to the original sample data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Data</span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Compliance notifications"
              aria-label="Compliance notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-semibold text-xs">Compliance Events</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No new events. Perform a consent withdrawal, RoPA approval, or breach notification to see events here.
                    </div>
                  ) : (
                    notifications.map((evt) => (
                      <div key={evt.id} className="py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-indigo-600 font-medium truncate">
                            {evt.event_type}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(evt.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Source: <span className="text-slate-800 font-medium">{evt.source_module}</span> ({evt.entity_type})
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
