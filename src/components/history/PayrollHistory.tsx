import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  FileSpreadsheet, 
  ArrowRight,
  X,
  Building,
  AlertCircle
} from 'lucide-react';
import { PayrollRun, SystemSettings, PayrollCalculatedRecord } from '../../types/payroll';
import { formatCurrency } from '../../services/payrollCalculator';
import { generatePayrollReportExcel, downloadFile } from '../../services/excelService';

interface PayrollHistoryProps {
  payrollRuns: PayrollRun[];
  settings: SystemSettings;
  onDeleteRun: (id: string) => Promise<void>;
  onNavigateToPayroll: () => void;
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({
  payrollRuns,
  settings,
  onDeleteRun,
  onNavigateToPayroll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);
  const [deletingRun, setDeletingRun] = useState<PayrollRun | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered runs
  const filteredRuns = payrollRuns.filter((run) => {
    const matchesQuery =
      run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.year.toString().includes(searchQuery);

    const matchesYear = selectedYear === 'All' || run.year.toString() === selectedYear;
    return matchesQuery && matchesYear;
  });

  const handleDelete = async () => {
    if (!deletingRun) return;
    setIsDeleting(true);
    try {
      await onDeleteRun(deletingRun.id);
      setDeletingRun(null);
    } catch (err: any) {
      alert(`Failed to delete payroll run: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadExcel = (run: PayrollRun) => {
    const excelBytes = generatePayrollReportExcel(run, settings.currencySymbol);
    downloadFile(excelBytes, `Payroll_Report_${run.periodKey}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runs by ID or Month (e.g. October, 2026)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button
            onClick={onNavigateToPayroll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <span>Run New Payroll</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Recorded Payroll Runs ({filteredRuns.length})
          </span>
          <span className="text-[11px] text-slate-400">Maintained in persistent database</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Payroll Run ID</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-center">Employees</th>
                <th className="py-3 px-4 text-right">Gross Payroll</th>
                <th className="py-3 px-4 text-right text-rose-600">Deductions</th>
                <th className="py-3 px-4 text-right font-bold text-teal-900">Net Disbursed</th>
                <th className="py-3 px-4 text-center">Processed Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] tabular-nums">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No payroll runs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Use "Run New Payroll" to process a cycle.</p>
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{run.id}</td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">
                      {run.month} {run.year}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">{run.activeEmployees}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(run.grossPayroll, settings.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600">
                      {formatCurrency(run.totalDeductions, settings.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-teal-800 bg-teal-50/20">
                      {formatCurrency(run.netPayroll, settings.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans text-slate-500 text-[11px]">
                      {new Date(run.processedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans border border-emerald-200">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => setViewingRun(run)}
                          title="View Run Records"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(run)}
                          title="Download Excel Report"
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRun(run)}
                          title="Delete / Rollback Run"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Run Details Drawer */}
      {viewingRun && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-3xl shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {viewingRun.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Payroll Run — {viewingRun.month} {viewingRun.year}
                </h3>
                <p className="text-xs text-slate-500">
                  Processed on {new Date(viewingRun.processedAt).toLocaleString()} by {viewingRun.processedBy}
                </p>
              </div>
              <button
                onClick={() => setViewingRun(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Gross Payroll</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {formatCurrency(viewingRun.grossPayroll, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Deductions (PF + Tax)</span>
                <span className="text-sm font-bold font-mono text-rose-600">
                  {formatCurrency(viewingRun.totalDeductions, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <span className="text-[10px] text-teal-800 uppercase block">Net Disbursed</span>
                <span className="text-sm font-bold font-mono text-teal-900">
                  {formatCurrency(viewingRun.netPayroll, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Individual Records Table */}
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                Individual Employee Records ({viewingRun.records.length})
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2 px-3">Emp ID</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3 text-right">Gross</th>
                      <th className="py-2 px-3 text-right text-rose-600">PF</th>
                      <th className="py-2 px-3 text-right text-rose-600">Tax</th>
                      <th className="py-2 px-3 text-right font-bold text-teal-800">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] tabular-nums">
                    {viewingRun.records.map((r) => (
                      <tr key={r.employeeId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.employeeId}</td>
                        <td className="py-2 px-3 font-sans text-slate-800 truncate max-w-[140px]">
                          {r.employeeName}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(r.grossSalary, settings.currencySymbol)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(r.pfDeduction, settings.currencySymbol)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(r.taxDeduction, settings.currencySymbol)}</td>
                        <td className="py-2 px-3 text-right font-bold text-teal-800">{formatCurrency(r.netSalary, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setViewingRun(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close Drawer
              </button>
              <button
                onClick={() => handleDownloadExcel(viewingRun)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export Report (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Run Confirmation Modal */}
      {deletingRun && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Rollback Payroll Run</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Are you sure you want to delete the finalized run for{' '}
              <span className="font-semibold text-slate-900">{deletingRun.month} {deletingRun.year}</span> ({deletingRun.id})? This will remove the audit log and financial ledger entry.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingRun(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
