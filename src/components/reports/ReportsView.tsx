import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  Layers, 
  PieChart as PieIcon, 
  Users, 
  Receipt,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { PayrollRun, Employee, SystemSettings } from '../../types/payroll';
import { formatCurrency, round2 } from '../../services/payrollCalculator';
import { downloadFile } from '../../services/excelService';

interface ReportsViewProps {
  payrollRuns: PayrollRun[];
  employees: Employee[];
  settings: SystemSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  payrollRuns,
  employees,
  settings,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'summary' | 'department' | 'deductions' | 'attendance'
  >('summary');

  const latestRun = payrollRuns[0];

  // 1. Department Breakdown calculation for latest run
  const departmentData = React.useMemo(() => {
    if (!latestRun) return [];
    const deptMap: Record<
      string,
      { count: number; gross: number; deductions: number; net: number }
    > = {};

    latestRun.records.forEach((r) => {
      const dept = r.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = { count: 0, gross: 0, deductions: 0, net: 0 };
      }
      deptMap[dept].count += 1;
      deptMap[dept].gross = round2(deptMap[dept].gross + r.grossSalary);
      deptMap[dept].deductions = round2(deptMap[dept].deductions + r.totalDeductions);
      deptMap[dept].net = round2(deptMap[dept].net + r.netSalary);
    });

    return Object.entries(deptMap).map(([dept, vals]) => ({
      department: dept,
      headcount: vals.count,
      gross: vals.gross,
      deductions: vals.deductions,
      net: vals.net,
      avgNet: round2(vals.net / vals.count),
    }));
  }, [latestRun]);

  // 2. Deduction Summary breakdown
  const deductionData = React.useMemo(() => {
    if (!latestRun) return [];
    return latestRun.records.map((r) => ({
      employeeId: r.employeeId,
      name: r.employeeName,
      department: r.department,
      basicPayable: r.basicSalaryPayable,
      pfRate: `${r.pfPercentage}%`,
      pfAmount: r.pfDeduction,
      grossSalary: r.grossSalary,
      taxRate: `${r.taxPercentage}%`,
      taxAmount: r.taxDeduction,
      totalDeductions: r.totalDeductions,
    }));
  }, [latestRun]);

  // 3. Attendance vs Net comparison
  const attendanceComparison = React.useMemo(() => {
    if (!latestRun) return [];
    return latestRun.records.map((r) => ({
      name: r.employeeName,
      id: r.employeeId,
      workingDays: r.workingDays,
      daysWorked: r.daysWorked,
      prorationRatio: `${Math.round((r.daysWorked / r.workingDays) * 100)}%`,
      basicMonthly: r.basicMonthlySalary,
      basicPayable: r.basicSalaryPayable,
      netSalary: r.netSalary,
    }));
  }, [latestRun]);

  // Export functions
  const handleExportExcel = () => {
    if (!latestRun) {
      alert('No payroll run available to export.');
      return;
    }

    const wb = XLSX.utils.book_new();

    if (selectedReportType === 'summary' || selectedReportType === 'department') {
      const wsDept = XLSX.utils.json_to_sheet(
        departmentData.map((d) => ({
          Department: d.department,
          'Employee Headcount': d.headcount,
          [`Gross Payroll (${settings.currencySymbol})`]: d.gross,
          [`Total Deductions (${settings.currencySymbol})`]: d.deductions,
          [`Net Disbursement (${settings.currencySymbol})`]: d.net,
          [`Average Net (${settings.currencySymbol})`]: d.avgNet,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsDept, 'Department_Salary_Summary');
    }

    if (selectedReportType === 'deductions' || selectedReportType === 'summary') {
      const wsDed = XLSX.utils.json_to_sheet(
        deductionData.map((d) => ({
          'Emp ID': d.employeeId,
          'Employee Name': d.name,
          Department: d.department,
          'Basic Payable': d.basicPayable,
          'PF Rate': d.pfRate,
          'PF Amount': d.pfAmount,
          'Gross Salary': d.grossSalary,
          'Tax Rate': d.taxRate,
          'Tax TDS': d.taxAmount,
          'Total Deductions': d.totalDeductions,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsDed, 'Statutory_Deductions');
    }

    if (selectedReportType === 'attendance') {
      const wsAtt = XLSX.utils.json_to_sheet(
        attendanceComparison.map((a) => ({
          'Emp ID': a.id,
          'Employee Name': a.name,
          'Working Days': a.workingDays,
          'Days Worked': a.daysWorked,
          'Attendance Ratio': a.prorationRatio,
          'Full Basic Monthly': a.basicMonthly,
          'Prorated Basic Payable': a.basicPayable,
          'Final Net Salary': a.netSalary,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance_Proration_Analysis');
    }

    const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
    downloadFile(bytes, `PayFlow_Report_${selectedReportType}_${latestRun.periodKey}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!latestRun) return;
    let dataToExport: any[] = [];
    if (selectedReportType === 'department') {
      dataToExport = departmentData;
    } else if (selectedReportType === 'deductions') {
      dataToExport = deductionData;
    } else {
      dataToExport = latestRun.records.map((r) => ({
        EmpID: r.employeeId,
        Name: r.employeeName,
        Dept: r.department,
        Gross: r.grossSalary,
        PF: r.pfDeduction,
        Tax: r.taxDeduction,
        Net: r.netSalary,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PayFlow_${selectedReportType}_${latestRun.periodKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!latestRun) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">No Finalized Reports Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          Complete a payroll preparation cycle first to generate analytics and financial breakdown charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Filter and Export Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Report Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedReportType('summary')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedReportType === 'summary'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payroll Summary
          </button>
          <button
            onClick={() => setSelectedReportType('department')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedReportType === 'department'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Department Breakdown
          </button>
          <button
            onClick={() => setSelectedReportType('deductions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedReportType === 'deductions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Statutory Deductions (PF & Tax)
          </button>
          <button
            onClick={() => setSelectedReportType('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedReportType === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Proration Analysis
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Report Content based on selection */}
      {selectedReportType === 'summary' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase">Active Workforce</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">{latestRun.activeEmployees}</div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{latestRun.month} {latestRun.year} Cycle</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase">Gross Payroll</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatCurrency(latestRun.grossPayroll, settings.currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Total Earning Liability</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase">Statutory Deductions</span>
              <div className="text-xl font-bold text-rose-600 font-mono mt-1">
                {formatCurrency(latestRun.totalDeductions, settings.currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">PF: {formatCurrency(latestRun.totalPF, settings.currencySymbol)} · Tax: {formatCurrency(latestRun.totalTax, settings.currencySymbol)}</span>
            </div>
            <div className="bg-white rounded-xl border border-teal-200 bg-teal-50/40 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-teal-800 uppercase">Net Disbursed</span>
              <div className="text-xl font-bold text-teal-900 font-mono mt-1">
                {formatCurrency(latestRun.netPayroll, settings.currencySymbol)}
              </div>
              <span className="text-[11px] text-teal-700 mt-0.5 block">Disbursement Direct Deposit</span>
            </div>
          </div>

          {/* Department Headcount and Cost Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Department Net vs Gross Allocation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Financial expenditure comparison for {latestRun.month} {latestRun.year}</p>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="department" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), settings.currencySymbol), '']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="gross" name="Gross Payroll" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net Disbursed" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedReportType === 'department' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Department Salary Breakdown ({latestRun.month} {latestRun.year})
            </span>
            <span className="text-[11px] text-slate-500">{departmentData.length} active departments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Headcount</th>
                  <th className="py-3 px-4 text-right">Gross Total</th>
                  <th className="py-3 px-4 text-right text-rose-600">Deductions</th>
                  <th className="py-3 px-4 text-right font-bold text-teal-800">Net Disbursement</th>
                  <th className="py-3 px-4 text-right">Avg Net / Person</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] tabular-nums">
                {departmentData.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{d.department}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{d.headcount}</td>
                    <td className="py-3 px-4 text-right text-slate-900 font-bold">
                      {formatCurrency(d.gross, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      {formatCurrency(d.deductions, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-800 bg-teal-50/20">
                      {formatCurrency(d.net, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(d.avgNet, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'deductions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Statutory Deductions Register — PF & TDS Schedule ({latestRun.month} {latestRun.year})
            </span>
            <span className="text-[11px] text-slate-500">Total Statutory Withholding: {formatCurrency(latestRun.totalDeductions, settings.currencySymbol)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Basic Payable</th>
                  <th className="py-3 px-4 text-center">PF Rate</th>
                  <th className="py-3 px-4 text-right text-rose-600">PF Deduction</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-center">TDS Rate</th>
                  <th className="py-3 px-4 text-right text-rose-600">TDS Withheld</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Total Deductions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] tabular-nums">
                {deductionData.map((d) => (
                  <tr key={d.employeeId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{d.employeeId}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-800">{d.name}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">{d.department}</td>
                    <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(d.basicPayable, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{d.pfRate}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">{formatCurrency(d.pfAmount, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(d.grossSalary, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{d.taxRate}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">{formatCurrency(d.taxAmount, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(d.totalDeductions, settings.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Attendance Proration Analysis ({latestRun.month} {latestRun.year})
            </span>
            <span className="text-[11px] text-slate-500">Compares scheduled working days vs actual days worked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4 text-center">Working Days</th>
                  <th className="py-3 px-4 text-center">Days Worked</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Master Monthly Basic</th>
                  <th className="py-3 px-4 text-right">Prorated Basic Payable</th>
                  <th className="py-3 px-4 text-right font-bold text-teal-800">Final Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] tabular-nums">
                {attendanceComparison.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{a.id}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-800">{a.name}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600">{a.workingDays}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-900">{a.daysWorked}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans ${
                        a.daysWorked === a.workingDays
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'bg-amber-50 text-amber-700 font-semibold'
                      }`}>
                        {a.prorationRatio}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(a.basicMonthly, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-semibold">{formatCurrency(a.basicPayable, settings.currencySymbol)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-teal-800 bg-teal-50/20">{formatCurrency(a.netSalary, settings.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
