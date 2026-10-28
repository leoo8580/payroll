import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  Calendar, 
  Sparkles, 
  Cpu, 
  Play,
  Printer,
  Wand2,
  SlidersHorizontal,
  X,
  FileCheck2
} from 'lucide-react';
import { 
  Employee, 
  AttendanceItem, 
  PayrollCalculatedRecord, 
  ValidationIssue, 
  PayrollRun, 
  SystemSettings, 
  UiPathExecutionDetails 
} from '../../types/payroll';
import { 
  computeEmployeePayroll, 
  validateAttendanceRecords, 
  formatCurrency, 
  round2 
} from '../../services/payrollCalculator';
import { 
  parseAttendanceWorkbook, 
  generateAttendanceTemplate, 
  generatePayrollReportExcel, 
  generateErrorReportExcel, 
  downloadFile 
} from '../../services/excelService';

interface PayrollWorkflowProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  settings: SystemSettings;
  onSaveRun: (run: PayrollRun) => Promise<PayrollRun>;
  onTriggerUiPath: (payload: any) => Promise<UiPathExecutionDetails>;
  onNavigateToHistory: () => void;
  onNavigateToEmployees?: () => void;
}

export const PayrollWorkflow: React.FC<PayrollWorkflowProps> = ({
  employees,
  payrollRuns,
  settings,
  onSaveRun,
  onTriggerUiPath,
  onNavigateToHistory,
  onNavigateToEmployees,
}) => {
  // Mode: 'autopilot' (1-click end-to-end automation) vs 'guided' (step-by-step)
  const [processingMode, setProcessingMode] = useState<'autopilot' | 'guided'>('autopilot');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Period and working days
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [workingDays, setWorkingDays] = useState(settings.defaultWorkingDays || 26);
  const periodKey = `${selectedYear}-${selectedMonth === 'October' ? '10' : selectedMonth === 'November' ? '11' : '12'}`;

  // Ingestion & Validation
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceItem[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationIssue[]>([]);
  const [validAttendanceCount, setValidAttendanceCount] = useState(0);
  const [invalidAttendanceCount, setInvalidAttendanceCount] = useState(0);
  const [activeValidationTab, setActiveValidationTab] = useState<'valid' | 'errors'>('valid');

  // Calculations
  const [calculatedRecords, setCalculatedRecords] = useState<PayrollCalculatedRecord[]>([]);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PayrollCalculatedRecord | null>(null);
  const [selectedRecordForPayslip, setSelectedRecordForPayslip] = useState<PayrollCalculatedRecord | null>(null);

  // Automation Execution
  const [isExecutingAutomation, setIsExecutingAutomation] = useState(false);
  const [automationLogText, setAutomationLogText] = useState<string>('');
  const [uipathDetails, setUipathDetails] = useState<UiPathExecutionDetails | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default attendance from master employees
  useEffect(() => {
    if (employees.length > 0) {
      loadMasterAttendance();
    }
  }, [employees, workingDays]);

  const loadMasterAttendance = () => {
    const activeEmps = employees.filter(e => e.employmentStatus !== 'Terminated');
    const defaultList: AttendanceItem[] = activeEmps.map(emp => ({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      workingDays,
      daysWorked: workingDays,
      leaveDays: 0,
      overtimeHours: 0,
    }));
    setAttendanceRecords(defaultList);
    setUploadedFile({ name: `Master_Roster_Attendance_${periodKey}.xlsx`, size: 14500 });

    const result = validateAttendanceRecords(defaultList, employees, workingDays);
    setValidationIssues(result.invalidIssues);
    setValidationWarnings(result.warnings);
    setValidAttendanceCount(result.validRecords.length);
    setInvalidAttendanceCount(result.invalidIssues.length);
  };

  // Parse uploaded file
  const processUploadedArrayBuffer = (buffer: ArrayBuffer, fileName: string, fileSize: number) => {
    setIsUploading(true);
    setUploadProgress(30);

    setTimeout(() => {
      try {
        setUploadProgress(70);
        const parsed = parseAttendanceWorkbook(buffer);
        setUploadProgress(100);

        setUploadedFile({ name: fileName, size: fileSize });
        setAttendanceRecords(parsed);

        const result = validateAttendanceRecords(parsed, employees, workingDays);
        setValidationIssues(result.invalidIssues);
        setValidationWarnings(result.warnings);
        setValidAttendanceCount(result.validRecords.length);
        setInvalidAttendanceCount(result.invalidIssues.length);

        if (result.invalidIssues.length > 0) {
          setActiveValidationTab('errors');
        } else {
          setActiveValidationTab('valid');
        }
      } catch (err: any) {
        alert(`Error parsing Excel workbook: ${err.message || 'Invalid format'}`);
      } finally {
        setIsUploading(false);
      }
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processUploadedArrayBuffer(buffer, file.name, file.size);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processUploadedArrayBuffer(buffer, file.name, file.size);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Automated Error Sanitizer / Clamp
  const handleAutoFixValidationIssues = () => {
    const clampedList = attendanceRecords.map(item => {
      const wDays = Number(item.workingDays) || workingDays;
      let dWorked = Number(item.daysWorked) || 0;
      if (dWorked > wDays) dWorked = wDays;
      if (dWorked < 0) dWorked = 0;
      return {
        ...item,
        workingDays: wDays,
        daysWorked: dWorked,
        leaveDays: Math.max(0, wDays - dWorked),
      };
    });

    setAttendanceRecords(clampedList);
    const result = validateAttendanceRecords(clampedList, employees, workingDays);
    setValidationIssues(result.invalidIssues);
    setValidationWarnings(result.warnings);
    setValidAttendanceCount(result.validRecords.length);
    setInvalidAttendanceCount(result.invalidIssues.length);
    setActiveValidationTab('valid');
  };

  // Perform calculations
  const computeAllRecords = (): PayrollCalculatedRecord[] => {
    const validationResult = validateAttendanceRecords(attendanceRecords, employees, workingDays);
    const validMap = new Map<string, AttendanceItem>();
    validationResult.validRecords.forEach(v => validMap.set(v.employeeId, v));

    const records: PayrollCalculatedRecord[] = [];

    employees.forEach(emp => {
      if (validMap.has(emp.employeeId)) {
        const attendance = validMap.get(emp.employeeId)!;
        const calculated = computeEmployeePayroll({
          employee: emp,
          workingDays: attendance.workingDays || workingDays,
          daysWorked: attendance.daysWorked,
          leaveDays: attendance.leaveDays,
        });
        records.push(calculated);
      }
    });

    setCalculatedRecords(records);
    return records;
  };

  // One-Click End-to-End Automation (The "Automated" Feature)
  const handleRunFullAutomation = async () => {
    if (employees.length === 0) {
      alert('Please add or import employees in the Employees directory before running automation.');
      return;
    }

    setIsExecutingAutomation(true);
    setAutomationLogText('Ingesting attendance records and validating against Employee Master...');

    try {
      // Step 1: Calculate all formulas
      const records = computeAllRecords();
      if (records.length === 0) {
        throw new Error('No valid attendance records could be computed.');
      }

      await new Promise(r => setTimeout(r, 400));
      setAutomationLogText(`Computed salary components for ${records.length} employees (Proration, HRA, DA, PF, Tax)...`);

      await new Promise(r => setTimeout(r, 400));
      setAutomationLogText('Invoking UiPath Excel Activities COM Automation Scope...');

      // Step 2: Trigger backend RPA engine
      const details = await onTriggerUiPath({
        periodKey,
        month: selectedMonth,
        year: selectedYear,
        recordsCount: records.length,
        workingDays,
      });
      setUipathDetails(details);

      await new Promise(r => setTimeout(r, 400));
      setAutomationLogText('Compiling Payroll_Report.xlsx multi-sheet workbook...');

      // Step 3: Compute totals and commit run
      const grossPayroll = round2(records.reduce((acc, r) => acc + r.grossSalary, 0));
      const totalDeductions = round2(records.reduce((acc, r) => acc + r.totalDeductions, 0));
      const totalPF = round2(records.reduce((acc, r) => acc + r.pfDeduction, 0));
      const totalTax = round2(records.reduce((acc, r) => acc + r.taxDeduction, 0));
      const netPayroll = round2(records.reduce((acc, r) => acc + r.netSalary, 0));

      const runId = `PAY-${selectedYear}-${selectedMonth === 'October' ? '10' : selectedMonth === 'November' ? '11' : '12'}`;

      const newRun: PayrollRun = {
        id: runId,
        month: selectedMonth,
        year: selectedYear,
        periodKey,
        processedAt: new Date().toISOString(),
        processedBy: 'Payroll Administrator (HR Ops)',
        totalEmployees: employees.length,
        activeEmployees: records.length,
        grossPayroll,
        totalDeductions,
        totalPF,
        totalTax,
        netPayroll,
        status: 'Finalized',
        records,
        invalidRecords: validationIssues,
        uipathExecutionDetails: details,
      };

      await onSaveRun(newRun);
      setIsFinalized(true);
      setSavedRunId(runId);

      // Step 4: Automatically trigger download of generated Excel workbook
      const excelBytes = generatePayrollReportExcel(newRun, settings.currencySymbol);
      downloadFile(excelBytes, `Payroll_Report_${periodKey}.xlsx`);

      setAutomationLogText('Automation complete: Saved to history & Payroll_Report.xlsx exported.');
    } catch (err: any) {
      alert(`Automation error: ${err.message}`);
    } finally {
      setIsExecutingAutomation(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validAttendanceCount === 0) {
        alert('Cannot continue: No valid employee attendance records detected.');
        return;
      }
      computeAllRecords();
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const totalGross = round2(calculatedRecords.reduce((acc, r) => acc + r.grossSalary, 0));
  const totalDeductions = round2(calculatedRecords.reduce((acc, r) => acc + r.totalDeductions, 0));
  const totalNet = round2(calculatedRecords.reduce((acc, r) => acc + r.netSalary, 0));

  // If no employees exist yet, show clean actionable state
  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Add Employees Before Preparing Payroll</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
          The automated calculation engine requires at least one employee in the directory to prorate salaries and calculate statutory deductions.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {onNavigateToEmployees && (
            <button
              onClick={onNavigateToEmployees}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Go to Employee Directory →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Automation Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Automated Payroll Processing
            </h2>
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              RPA Auto-Pilot
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute 1-click end-to-end payroll automation or follow the guided verification wizard.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setProcessingMode('autopilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              processingMode === 'autopilot'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-teal-400" />
            <span>1-Click Automation</span>
          </button>
          <button
            onClick={() => setProcessingMode('guided')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              processingMode === 'guided'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
            <span>Guided 4-Step Flow</span>
          </button>
        </div>
      </div>

      {/* AUTO-PILOT MODE: 1-Click End-to-End Automation */}
      {processingMode === 'autopilot' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automation Settings & Input</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure period parameters and trigger the complete RPA pipeline</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                Active Staff: {employees.filter(e => e.employmentStatus === 'Active').length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payroll Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                  <option value="September">September</option>
                  <option value="August">August</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payroll Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Working Days in Month</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Math.max(1, Math.min(31, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Attendance Spreadsheet Drop Area */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">Attendance Data Source</span>
                <button
                  type="button"
                  onClick={() => {
                    const bytes = generateAttendanceTemplate(employees, workingDays);
                    downloadFile(bytes, `Attendance_Template_${periodKey}.xlsx`);
                  }}
                  className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blank Attendance Sheet (.xlsx)</span>
                </button>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/10 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-teal-600 mx-auto group-hover:scale-105 transition-transform" />
                <p className="text-xs font-bold text-slate-800 mt-2">
                  Drop custom attendance spreadsheet or click to browse
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Optional: If no file is dropped, PayFlow automatically uses standard full attendance for all {employees.length} employees.
                </p>
              </div>

              {uploadedFile && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate">Source: {uploadedFile.name}</span>
                  <span className="font-mono text-teal-800 font-bold">{attendanceRecords.length} records staged</span>
                </div>
              )}
            </div>

            {/* Primary Automation Launch Button */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Executes data validation, proration, UiPath COM scope, Excel report writing, and history save.
              </div>

              <button
                onClick={handleRunFullAutomation}
                disabled={isExecutingAutomation}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                {isExecutingAutomation ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Executing Automation Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-slate-900" />
                    <span>Run End-to-End Automation Pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Real-time Automation Execution Monitor */}
            {isExecutingAutomation && (
              <div className="mt-5 p-4 rounded-xl bg-slate-900 text-teal-300 text-xs font-mono flex items-center gap-3 animate-in fade-in">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400 shrink-0" />
                <span>{automationLogText}</span>
              </div>
            )}

            {/* Finalized Automation Banner */}
            {isFinalized && !isExecutingAutomation && (
              <div className="mt-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm">
                      Automation Successfully Executed & Downloaded!
                    </span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Run ID: {savedRunId}
                  </span>
                </div>

                <p className="leading-relaxed text-emerald-900">
                  {calculatedRecords.length} employee records were processed. Total Net Disbursed: <span className="font-bold">{formatCurrency(totalNet, settings.currencySymbol)}</span>. The multi-sheet <span className="font-semibold">Payroll_Report.xlsx</span> was automatically downloaded to your machine.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onNavigateToHistory}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    View in Payroll History →
                  </button>
                  <button
                    onClick={() => {
                      if (calculatedRecords.length > 0) {
                        setSelectedRecordForPayslip(calculatedRecords[0]);
                      }
                    }}
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold rounded-lg transition-colors"
                  >
                    Generate & Print Payslips
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GUIDED 4-STEP MODE */}
      {processingMode === 'guided' && (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-2">
              {[
                { num: 1, label: 'Period' },
                { num: 2, label: 'Validation' },
                { num: 3, label: 'Calculations' },
                { num: 4, label: 'RPA & Export' },
              ].map(s => (
                <div
                  key={s.num}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    currentStep === s.num
                      ? 'bg-slate-900 text-white'
                      : currentStep > s.num
                      ? 'bg-teal-50 text-teal-800'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guided Step 1 */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Step 1 — Configure Period</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                    <option value="September">September</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Working Days</label>
                  <input
                    type="number"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Continue to Validation →
                </button>
              </div>
            </div>
          )}

          {/* Guided Step 2: Validation */}
          {currentStep === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 2 — Ingestion & Validation</h3>
                  <p className="text-xs text-slate-500">Checking IDs and attendance limits</p>
                </div>
                {invalidAttendanceCount > 0 && (
                  <button
                    onClick={handleAutoFixValidationIssues}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Fix & Clamp Out-of-Bounds Days</span>
                  </button>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 p-6 text-center rounded-xl cursor-pointer bg-slate-50 hover:bg-teal-50/20"
              >
                <Upload className="w-6 h-6 text-teal-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800 mt-2">Upload Attendance Spreadsheet</p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={validAttendanceCount === 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
                >
                  Continue to Calculations ({validAttendanceCount} Valid) →
                </button>
              </div>
            </div>
          )}

          {/* Guided Step 3: Calculations */}
          {currentStep === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 3 — Review Calculations</h3>
                  <p className="text-xs text-slate-500">Prorated Basic, Allowances, Gross, PF, Tax, and Net Salary</p>
                </div>
                <div className="text-xs font-mono font-bold text-teal-800">
                  Total Net: {formatCurrency(totalNet, settings.currencySymbol)}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-600">
                    <tr>
                      <th className="p-2">Emp ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2 text-right">Basic Payable</th>
                      <th className="p-2 text-right">Gross</th>
                      <th className="p-2 text-right text-rose-600">PF</th>
                      <th className="p-2 text-right text-rose-600">Tax</th>
                      <th className="p-2 text-right text-teal-800 font-bold">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedRecords.map(r => (
                      <tr key={r.employeeId} className="hover:bg-slate-50">
                        <td className="p-2 font-bold">{r.employeeId}</td>
                        <td className="p-2 font-sans">{r.employeeName}</td>
                        <td className="p-2 text-right">{formatCurrency(r.basicSalaryPayable, settings.currencySymbol)}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(r.grossSalary, settings.currencySymbol)}</td>
                        <td className="p-2 text-right text-rose-600">{formatCurrency(r.pfDeduction, settings.currencySymbol)}</td>
                        <td className="p-2 text-right text-rose-600">{formatCurrency(r.taxDeduction, settings.currencySymbol)}</td>
                        <td className="p-2 text-right font-bold text-teal-800">{formatCurrency(r.netSalary, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Continue to RPA & Export →
                </button>
              </div>
            </div>
          )}

          {/* Guided Step 4 */}
          {currentStep === 4 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Step 4 — Finish & Export</h3>
              <p className="text-xs text-slate-500">Total Net Disbursement: {formatCurrency(totalNet, settings.currencySymbol)}</p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRunFullAutomation}
                  className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-xs"
                >
                  Export Payroll_Report.xlsx & Finish
                </button>
                <button
                  onClick={() => {
                    if (calculatedRecords.length > 0) setSelectedRecordForPayslip(calculatedRecords[0]);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  View Payslips
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Payslip Modal */}
      {selectedRecordForPayslip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl p-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">{settings.companyName}</h3>
                <p className="text-[11px] text-slate-500">{settings.companyAddress}</p>
                <p className="text-[10px] text-slate-400 font-mono">Tax ID: {settings.taxRegistrationNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 block">
                  PAYSLIP
                </span>
                <span className="text-[11px] text-slate-600 font-semibold mt-1 block">
                  {selectedMonth} {selectedYear}
                </span>
              </div>
            </div>

            {/* Employee Meta Strip */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">EMPLOYEE NAME</span>
                <span className="font-bold text-slate-900">{selectedRecordForPayslip.employeeName}</span>
                <span className="text-slate-500 font-mono text-[11px] block">{selectedRecordForPayslip.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DEPARTMENT & ROLE</span>
                <span className="font-semibold text-slate-800">{selectedRecordForPayslip.designation}</span>
                <span className="text-slate-500 text-[11px] block">{selectedRecordForPayslip.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ATTENDANCE RATIO</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {selectedRecordForPayslip.daysWorked} Days Worked / {selectedRecordForPayslip.workingDays} Total Days
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PAYMENT METHOD</span>
                <span className="font-semibold text-slate-800">Direct Bank Transfer</span>
              </div>
            </div>

            {/* Earnings & Deductions Columns */}
            <div className="grid grid-cols-2 gap-6 py-4 text-xs font-mono">
              {/* Earnings */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 font-sans uppercase mb-2 pb-1 border-b border-slate-200">
                  Earnings
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Basic Payable</span>
                    <span>{formatCurrency(selectedRecordForPayslip.basicSalaryPayable, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA ({selectedRecordForPayslip.hraPercentage}%)</span>
                    <span>{formatCurrency(selectedRecordForPayslip.hra, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DA ({selectedRecordForPayslip.daPercentage}%)</span>
                    <span>{formatCurrency(selectedRecordForPayslip.da, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Allowances</span>
                    <span>{formatCurrency(selectedRecordForPayslip.otherAllowancesPayable, settings.currencySymbol)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Gross Earnings</span>
                    <span>{formatCurrency(selectedRecordForPayslip.grossSalary, settings.currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 font-sans uppercase mb-2 pb-1 border-b border-slate-200">
                  Deductions
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between text-rose-700">
                    <span>PF ({selectedRecordForPayslip.pfPercentage}%)</span>
                    <span>{formatCurrency(selectedRecordForPayslip.pfDeduction, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Tax TDS ({selectedRecordForPayslip.taxPercentage}%)</span>
                    <span>{formatCurrency(selectedRecordForPayslip.taxDeduction, settings.currencySymbol)}</span>
                  </div>
                  <div className="pt-6 border-t border-slate-200 flex justify-between font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(selectedRecordForPayslip.totalDeductions, settings.currencySymbol)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs my-2">
              <div>
                <span className="text-[10px] text-teal-800 font-semibold uppercase block">NET DISBURSEMENT PAYABLE</span>
                <span className="text-slate-600 text-[11px]">Transferred to registered bank account</span>
              </div>
              <div className="text-lg font-bold font-mono text-teal-900">
                {formatCurrency(selectedRecordForPayslip.netSalary, settings.currencySymbol)}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecordForPayslip(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
