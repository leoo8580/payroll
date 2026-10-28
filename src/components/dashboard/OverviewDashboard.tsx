import React from 'react';
import { 
  Users, 
  Wallet, 
  Receipt, 
  BadgePercent, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building,
  Calendar,
  FileCheck2,
  FileSpreadsheet,
  Upload,
  Plus,
  Wand2,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Employee, PayrollRun, SystemSettings } from '../../types/payroll';
import { formatCurrency } from '../../services/payrollCalculator';

interface OverviewDashboardProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  settings: SystemSettings;
  onNavigateToPayroll: () => void;
  onNavigateToEmployees: () => void;
  onNavigateToHistory: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  employees,
  payrollRuns,
  settings,
  onNavigateToPayroll,
  onNavigateToEmployees,
  onNavigateToHistory,
}) => {
  const activeEmployees = employees.filter((e) => e.employmentStatus === 'Active');
  const onLeaveEmployees = employees.filter((e) => e.employmentStatus === 'On Leave');

  const latestRun = payrollRuns[0];
  const previousRun = payrollRuns[1];

  const currentGross = latestRun ? latestRun.grossPayroll : 0;
  const currentNet = latestRun ? latestRun.netPayroll : 0;
  const currentDeductions = latestRun ? latestRun.totalDeductions : 0;
  const avgNetSalary = latestRun && latestRun.activeEmployees > 0 
    ? Math.round(latestRun.netPayroll / latestRun.activeEmployees) 
    : 0;

  const prevGross = previousRun ? previousRun.grossPayroll : 0;
  const prevDeductions = previousRun ? previousRun.totalDeductions : 0;
  const prevAvgNet = previousRun && previousRun.activeEmployees > 0 
    ? Math.round(previousRun.netPayroll / previousRun.activeEmployees) 
    : 0;

  const grossDeltaPercent = prevGross > 0 ? ((currentGross - prevGross) / prevGross) * 100 : 0;
  const avgNetDeltaPercent = prevAvgNet > 0 ? ((avgNetSalary - prevAvgNet) / prevAvgNet) * 100 : 0;

  // Monthly trends from actual runs
  const monthlyTrendsData = payrollRuns.length > 0 
    ? [...payrollRuns].reverse().map((run) => ({
        period: `${run.month.slice(0, 3)} ${run.year}`,
        Gross: run.grossPayroll,
        Net: run.netPayroll,
        Deductions: run.totalDeductions,
      }))
    : [];

  // Department distribution from current employees
  const departmentBreakdown = activeEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'Other';
    const monthlyGross = emp.basicSalary * (1 + (emp.hraPercentage + emp.daPercentage) / 100) + (emp.otherAllowances || 0);
    acc[dept] = (acc[dept] || 0) + monthlyGross;
    return acc;
  }, {} as Record<string, number>);

  const departmentChartData = Object.entries(departmentBreakdown)
    .map(([dept, total]) => ({
      department: dept,
      amount: Math.round(total),
      formatted: formatCurrency(Math.round(total), settings.currencySymbol),
    }))
    .sort((a, b) => b.amount - a.amount);

  const DEPARTMENT_COLORS = ['#0F172A', '#0D9488', '#2563EB', '#6366F1', '#D97706', '#059669', '#E11D48'];

  // Clean empty state when starting completely fresh
  if (employees.length === 0) {
    return (
      <div className="space-y-8 pb-12 max-w-5xl mx-auto pt-4">
        {/* Welcome Hero Banner */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-white shadow-md relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Workspace · No Dummy Data</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome to PayFlow Automated Payroll
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Your fresh enterprise environment is ready. You can build your own real organization by adding employees manually or auto-importing an entire staff roster from an Excel sheet.
            </p>
          </div>
        </div>

        {/* 3 Step Onboarding Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Add or Auto-Import Staff</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Create employees one-by-one with compensation rules, or drop your existing Excel roster to import all employees instantly.
              </p>
            </div>
            <button
              onClick={onNavigateToEmployees}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Add First Employee</span>
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">1-Click Auto-Payroll</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Select your accounting period and execute automated calculation of Basic, HRA, DA, PF, Tax, and Net Salary with RPA logging.
              </p>
            </div>
            <button
              onClick={onNavigateToPayroll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Open Automation Wizard</span>
            </button>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reports & Payslips</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Download multi-sheet Excel registers (`Payroll_Report.xlsx`), statutory deduction schedules, and print professional employee payslips.
              </p>
            </div>
            <button
              onClick={onNavigateToHistory}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>View Payroll History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner / Processing Status Callout */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Current Payroll Cycle: October 2026</h2>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Ready for Preparation
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeEmployees.length} active employee profiles staged in master registry. {onLeaveEmployees.length} on approved leave.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPayroll}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
        >
          <Wand2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Prepare October 2026 Payroll</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Workforce</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {employees.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-emerald-700">{activeEmployees.length} Active</span>
              <span className="text-slate-300">·</span>
              <span>{onLeaveEmployees.length} On Leave</span>
            </div>
          </div>
        </div>

        {/* Card 2: Payroll This Month */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net Payroll Disbursed</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(currentNet, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {payrollRuns.length > 0 ? (
                grossDeltaPercent >= 0 ? (
                  <span className="inline-flex items-center text-emerald-700 font-semibold font-mono tabular-nums">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{grossDeltaPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-700 font-semibold font-mono tabular-nums">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {grossDeltaPercent.toFixed(1)}%
                  </span>
                )
              ) : (
                <span className="text-slate-400">First payroll run pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Total Deductions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Statutory Deductions</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(currentDeductions, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
              <span>PF: {formatCurrency(latestRun?.totalPF || 0, settings.currencySymbol)}</span>
              <span className="text-slate-300">·</span>
              <span>Tax: {formatCurrency(latestRun?.totalTax || 0, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Average Net Salary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Net Salary</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(avgNetSalary, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {payrollRuns.length > 0 ? (
                <span className="text-slate-500">Per eligible staff</span>
              ) : (
                <span className="text-slate-400">Calculates after first run</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payroll Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Payroll Expenditure Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gross disbursements, statutory deductions, and net payroll</p>
            </div>
            {monthlyTrendsData.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
                  <span className="text-slate-600">Gross</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-600" />
                  <span className="text-slate-600">Net</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-64 mt-4 flex items-center justify-center">
            {monthlyTrendsData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs">
                <p className="font-semibold text-slate-600">No Historical Runs Recorded Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Process your first payroll to generate expenditure graphs.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), settings.currencySymbol), '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Gross" fill="#0F172A" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Net" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department-Wise Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Department Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Estimated gross payroll by functional team</p>
          </div>

          <div className="space-y-3 mt-4">
            {departmentChartData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                No active employee records in department register.
              </div>
            ) : (
              departmentChartData.map((item, idx) => {
                const maxAmount = departmentChartData[0]?.amount || 1;
                const percent = Math.round((item.amount / maxAmount) * 100);
                return (
                  <div key={item.department} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.department}</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">{item.formatted}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
