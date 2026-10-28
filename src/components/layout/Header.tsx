import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Plus, 
  ArrowRight,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { ActiveTab, PayrollRun } from '../../types/payroll';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  payrollRuns: PayrollRun[];
  onPrimaryActionClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPeriod,
  setSelectedPeriod,
  payrollRuns,
  onPrimaryActionClick,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Tab titles
  const titles: Record<ActiveTab, { title: string; breadcrumb: string; primaryBtn: string; icon: any }> = {
    overview: {
      title: 'Payroll Overview',
      breadcrumb: 'PayFlow / Dashboard',
      primaryBtn: 'Prepare Payroll',
      icon: ArrowRight,
    },
    employees: {
      title: 'Employee Master Directory',
      breadcrumb: 'PayFlow / Employees',
      primaryBtn: 'Add Employee',
      icon: Plus,
    },
    'payroll-processing': {
      title: 'Payroll Processing Workflow',
      breadcrumb: 'PayFlow / Automation Wizard',
      primaryBtn: 'Download Template',
      icon: Download,
    },
    'payroll-history': {
      title: 'Payroll History & Runs',
      breadcrumb: 'PayFlow / History',
      primaryBtn: 'Run New Payroll',
      icon: Plus,
    },
    reports: {
      title: 'Financial & Statutory Reports',
      breadcrumb: 'PayFlow / Reports',
      primaryBtn: 'Export Register',
      icon: FileSpreadsheet,
    },
    'uipath-center': {
      title: 'UiPath RPA Integration Center',
      breadcrumb: 'PayFlow / UiPath Studio RPA',
      primaryBtn: 'Download Studio Files',
      icon: Download,
    },
    settings: {
      title: 'System & Payroll Rules',
      breadcrumb: 'PayFlow / Configuration',
      primaryBtn: 'Save Settings',
      icon: CheckCircle2,
    },
  };

  const currentMeta = titles[activeTab];

  // Dynamic notifications based on real data
  const notifications = [
    {
      id: 'notif-1',
      title: 'September 2026 Payroll Finalized',
      time: '3 days ago',
      type: 'success',
      description: '15 employees processed successfully with 0 calculation warnings.',
    },
    {
      id: 'notif-2',
      title: 'UiPath Worker Ready',
      time: '1 hour ago',
      type: 'info',
      description: 'Local Excel RPA execution node is online and healthy.',
    },
    {
      id: 'notif-3',
      title: 'Active Period: October 2026',
      time: 'Today',
      type: 'warning',
      description: 'Attendance spreadsheet upload pending for the current cycle.',
    },
  ];

  const ActionIcon = currentMeta.icon;

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-6 sticky top-0 z-20">
      {/* Zone 1: Current Page Title & Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <nav className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
            {currentMeta.breadcrumb}
          </nav>
          <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Period Selector & Functional Notification Center */}
      <div className="flex items-center gap-4">
        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications & Activity</span>
                <span className="text-[11px] text-slate-500">3 unread</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                      {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-medium text-teal-700 hover:text-teal-800"
                >
                  Close notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Action Button */}
      <div className="shrink-0">
        <button
          onClick={onPrimaryActionClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap"
        >
          <ActionIcon className="w-3.5 h-3.5 text-teal-400" />
          <span>{currentMeta.primaryBtn}</span>
        </button>
      </div>
    </header>
  );
};
