import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { PayrollWorkflow } from './components/payroll/PayrollWorkflow';
import { PayrollHistory } from './components/history/PayrollHistory';
import { ReportsView } from './components/reports/ReportsView';
import { UiPathCenter } from './components/uipath/UiPathCenter';
import { SettingsView } from './components/settings/SettingsView';
import { api } from './services/api';
import { Employee, PayrollRun, SystemSettings, ActiveTab } from './types/payroll';
import { INITIAL_SETTINGS } from './data/initialData';
import { generateAttendanceTemplate, downloadFile } from './services/excelService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const [empData, runsData, settingsData] = await Promise.all([
          api.getEmployees(),
          api.getPayrollRuns(),
          api.getSettings(),
        ]);
        setEmployees(empData);
        setPayrollRuns(runsData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Employee CRUD handlers
  const handleAddEmployee = async (newEmp: Partial<Employee>) => {
    const created = await api.createEmployee(newEmp);
    setEmployees((prev) => [created, ...prev]);
    showToast(`Employee ${created.fullName} (${created.employeeId}) added successfully.`);
  };

  const handleBulkImportEmployees = async (list: Partial<Employee>[]) => {
    const updatedList = await api.bulkImportEmployees(list);
    setEmployees(updatedList);
    showToast(`Auto-imported ${list.length} employee records from Excel.`);
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    const updated = await api.updateEmployee(id, updates);
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    showToast(`Employee ${updated.fullName} updated.`);
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast('Employee deleted from master registry.');
  };

  // Payroll Run handlers
  const handleSavePayrollRun = async (run: PayrollRun) => {
    const saved = await api.savePayrollRun(run);
    setPayrollRuns((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id || r.periodKey === saved.periodKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    showToast(`Payroll run for ${saved.month} ${saved.year} saved successfully.`);
    return saved;
  };

  const handleDeletePayrollRun = async (id: string) => {
    await api.deletePayrollRun(id);
    setPayrollRuns((prev) => prev.filter((r) => r.id !== id));
    showToast('Payroll run rolled back.');
  };

  // UiPath Trigger
  const handleTriggerUiPath = async (payload: any) => {
    return await api.triggerUiPathRPA(payload);
  };

  // Settings & Fresh wipe
  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
    showToast('System configuration saved.');
  };

  const handleResetDemo = async () => {
    await api.resetDemoData();
    setEmployees([]);
    setPayrollRuns([]);
    showToast('Clean fresh start: all data cleared.');
  };

  const handleClearAllData = async () => {
    await api.clearAllData();
    setEmployees([]);
    setPayrollRuns([]);
    showToast('All employee and payroll data wiped clean.');
  };

  const handleLoadSampleData = async () => {
    await api.loadSampleData();
    const [empData, runsData] = await Promise.all([
      api.getEmployees(),
      api.getPayrollRuns(),
    ]);
    setEmployees(empData);
    setPayrollRuns(runsData);
    showToast('Sample dataset loaded for demonstration.');
  };

  // Header primary action handler based on active tab
  const handlePrimaryActionClick = () => {
    if (activeTab === 'overview') {
      setActiveTab('payroll-processing');
    } else if (activeTab === 'employees') {
      // Let the employee view handle or navigate
      setActiveTab('employees');
      const addBtn = document.querySelector('button:has(svg.lucide-plus)');
      if (addBtn) (addBtn as HTMLElement).click();
    } else if (activeTab === 'payroll-processing') {
      const bytes = generateAttendanceTemplate(employees, settings.defaultWorkingDays);
      downloadFile(bytes, `Employee_Attendance_Input_${selectedPeriod}.xlsx`);
      showToast('Attendance template downloaded.');
    } else if (activeTab === 'payroll-history') {
      setActiveTab('payroll-processing');
    } else if (activeTab === 'reports') {
      const reportExportBtn = document.querySelector('button:has(svg.lucide-download)');
      if (reportExportBtn) (reportExportBtn as HTMLElement).click();
    } else if (activeTab === 'uipath-center') {
      const downloadBtn = document.querySelector('button:has(svg.lucide-download)');
      if (downloadBtn) (downloadBtn as HTMLElement).click();
    } else if (activeTab === 'settings') {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }
  };

  const activeEmployeeCount = employees.filter((e) => e.employmentStatus === 'Active').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-slate-800">Loading PayFlow Engine...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to persistent payroll storage & RPA services</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Permanent Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEmployeeCount={activeEmployeeCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header conforming to 3-zone contract */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          payrollRuns={payrollRuns}
          onPrimaryActionClick={handlePrimaryActionClick}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewDashboard
              employees={employees}
              payrollRuns={payrollRuns}
              settings={settings}
              onNavigateToPayroll={() => setActiveTab('payroll-processing')}
              onNavigateToEmployees={() => setActiveTab('employees')}
              onNavigateToHistory={() => setActiveTab('payroll-history')}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              employees={employees}
              settings={settings}
              onAddEmployee={handleAddEmployee}
              onBulkImportEmployees={handleBulkImportEmployees}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'payroll-processing' && (
            <PayrollWorkflow
              employees={employees}
              payrollRuns={payrollRuns}
              settings={settings}
              onSaveRun={handleSavePayrollRun}
              onTriggerUiPath={handleTriggerUiPath}
              onNavigateToHistory={() => setActiveTab('payroll-history')}
              onNavigateToEmployees={() => setActiveTab('employees')}
            />
          )}

          {activeTab === 'payroll-history' && (
            <PayrollHistory
              payrollRuns={payrollRuns}
              settings={settings}
              onDeleteRun={handleDeletePayrollRun}
              onNavigateToPayroll={() => setActiveTab('payroll-processing')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              payrollRuns={payrollRuns}
              employees={employees}
              settings={settings}
            />
          )}

          {activeTab === 'uipath-center' && <UiPathCenter />}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDemo={handleResetDemo}
              onClearAll={handleClearAllData}
              onLoadSample={handleLoadSampleData}
            />
          )}
        </main>
      </div>

      {/* Real Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
