import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  History, 
  BarChart3, 
  Cpu, 
  Settings, 
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../../types/payroll';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeEmployeeCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeEmployeeCount,
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees' as ActiveTab,
      label: 'Employees',
      icon: Users,
      badge: activeEmployeeCount.toString(),
    },
    {
      id: 'payroll-processing' as ActiveTab,
      label: 'Payroll Processing',
      icon: Calculator,
      badge: 'Step 1-4',
    },
    {
      id: 'payroll-history' as ActiveTab,
      label: 'Payroll History',
      icon: History,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'uipath-center' as ActiveTab,
      label: 'UiPath RPA Center',
      icon: Cpu,
      badge: 'RPA',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
          <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white tracking-tight">PayFlow</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/50">RPA</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Excel & UiPath Payroll</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-slate-700 text-teal-300' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Automation Worker Status Badge */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-teal-400 font-medium mb-1">
          <Cpu className="w-3.5 h-3.5" />
          <span>RPA Automation Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Excel activity engine connected for automated salary calculations.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs">
            HR
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-semibold text-white truncate">Payroll Administrator</p>
            <p className="text-[11px] text-slate-400 truncate">HR Operations Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
