import React from 'react';
import { useApp, AppNavTab } from '../context/AppContext.tsx';
import { ToolModuleType } from '../types/index.ts';
import {
  LayoutDashboard,
  CheckSquare,
  Search,
  Database,
  GitFork,
  UserCheck,
  Building,
  FileText,
  FileSpreadsheet,
  AlertOctagon,
  CalendarCheck,
  Flame,
  Scale,
  History,
  Lock,
} from 'lucide-react';

interface NavItem {
  id: AppNavTab;
  moduleKey?: ToolModuleType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, isEntitled, currentTenant } = useApp();

  const groups: NavGroup[] = [
    {
      title: 'Oversight & Executive',
      items: [
        {
          id: 'cpo_dashboard',
          moduleKey: 'cpo_dashboard',
          label: 'CPO Dashboard',
          icon: LayoutDashboard,
          badge: 'Executive',
          badgeColor: 'bg-indigo-100 text-indigo-600 border border-indigo-200',
        },
        {
          id: 'board_report',
          label: 'Board Readiness (15-Sec)',
          icon: FileSpreadsheet,
          badge: 'Report',
          badgeColor: 'bg-teal-100 text-teal-700 border border-teal-200',
        },
      ],
    },
    {
      title: 'Data Inventory',
      items: [
        {
          id: 'data_discovery',
          moduleKey: 'data_discovery',
          label: 'Data Discovery',
          icon: Search,
        },
        {
          id: 'data_mapper',
          moduleKey: 'data_mapper',
          label: 'Data Mapper (RoPA)',
          icon: Database,
        },
        {
          id: 'flow_mapper',
          moduleKey: 'flow_mapper',
          label: 'Data Flow Mapper',
          icon: GitFork,
        },
      ],
    },
    {
      title: 'Privacy Operations',
      items: [
        {
          id: 'consent_manager',
          moduleKey: 'consent_manager',
          label: 'Consent & Preferences',
          icon: CheckSquare,
        },
        {
          id: 'rights_manager',
          moduleKey: 'rights_manager',
          label: 'Data Principal Rights',
          icon: UserCheck,
          badge: 'Sec 11/12',
          badgeColor: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        },
        {
          id: 'vendor_manager',
          moduleKey: 'vendor_manager',
          label: 'Vendor Risk & DPAs',
          icon: Building,
        },
        {
          id: 'policy_generator',
          moduleKey: 'policy_generator',
          label: 'Policy & Notices',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Risk & Assurance',
      items: [
        {
          id: 'dpia',
          moduleKey: 'dpia',
          label: 'DPIA Wizard',
          icon: Scale,
        },
        {
          id: 'risk_register',
          moduleKey: 'risk_register',
          label: 'Risk Register (5x5)',
          icon: AlertOctagon,
        },
        {
          id: 'breach_manager',
          moduleKey: 'breach_manager',
          label: 'Breach Manager',
          icon: Flame,
          badge: 'DPBI 6h/72h',
          badgeColor: 'bg-rose-100 text-rose-600 border border-rose-200',
        },
      ],
    },
    {
      title: 'Automation & Governance',
      items: [
        {
          id: 'automation',
          moduleKey: 'automation',
          label: 'Compliance Automation',
          icon: CalendarCheck,
        },
        {
          id: 'rules_engine',
          label: 'Regulatory Rules Registry',
          icon: Scale,
        },
        {
          id: 'audit_outbox',
          label: 'Audit Log & Events',
          icon: History,
        },
      ],
    },
  ];

  return (
    <>
    {/* Mobile backdrop */}
    <div
      onClick={onClose}
      className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden="true"
    />
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:static lg:z-auto lg:w-64 lg:max-w-none bg-white border-r border-slate-200 flex flex-col shrink-0 select-none shadow-xl lg:shadow-none transition-transform duration-200 ease-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold font-mono tracking-wider text-slate-500 uppercase">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isSelected = activeTab === item.id;
                const entitled = item.moduleKey ? isEntitled(item.moduleKey) : true;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold'
                        : entitled
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : entitled ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!entitled && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded font-mono">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {item.badge && entitled && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tenant Footprint */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
        <div className="text-[10px] truncate">
          CIN: {currentTenant?.cin ? currentTenant.cin.substring(0, 12) + '...' : 'N/A'}
        </div>
      </div>
    </aside>
    </>
  );
};
