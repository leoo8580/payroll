import React, { useState } from 'react';
import { 
  Cpu, 
  Download, 
  Code2, 
  Layers, 
  CheckCircle2, 
  ExternalLink, 
  Terminal, 
  BookOpen, 
  FileCode, 
  Copy, 
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { UIPATH_MAIN_XAML, UIPATH_PROJECT_JSON, UIPATH_DEMO_GUIDE } from '../../data/uipath/uipathWorkflow';
import { downloadFile } from '../../services/excelService';

export const UiPathCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'xaml' | 'projectJson' | 'viva'>('architecture');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadMainXaml = () => {
    const blob = new Blob([UIPATH_MAIN_XAML], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Main.xaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadProjectJson = () => {
    const blob = new Blob([UIPATH_PROJECT_JSON], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  UiPath RPA & Excel Engineering Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  UiPath Studio 2024.10 Compatible
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Complete architecture, XAML workflow definitions, sequence flowcharts, CLI execution instructions, and presentation scripts for college project viva evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadMainXaml}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Main.xaml</span>
            </button>
            <button
              onClick={downloadProjectJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>project.json</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`pb-3 text-xs font-semibold px-2 transition-colors relative ${
            activeSubTab === 'architecture'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          System Architecture & Activity Pipeline
        </button>
        <button
          onClick={() => setActiveSubTab('viva')}
          className={`pb-3 text-xs font-semibold px-2 transition-colors relative ${
            activeSubTab === 'viva'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          College Viva & Demo Guide
        </button>
        <button
          onClick={() => setActiveSubTab('xaml')}
          className={`pb-3 text-xs font-semibold px-2 transition-colors relative ${
            activeSubTab === 'xaml'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          UiPath Main.xaml Source
        </button>
        <button
          onClick={() => setActiveSubTab('projectJson')}
          className={`pb-3 text-xs font-semibold px-2 transition-colors relative ${
            activeSubTab === 'projectJson'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          project.json Config
        </button>
      </div>

      {/* TAB 1: System Architecture */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Architecture Pipeline Flow */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">End-to-End Enterprise RPA Integration Flow</h3>
            <p className="text-xs text-slate-500 mb-6">
              How the React SaaS frontend connects through the Node.js Express Controller to the UiPath automation runtime and Excel workbook outputs:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <h4 className="text-xs font-bold text-slate-900">React Frontend</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  HR user uploads Attendance Excel workbook, reviews detected rows, catches errors visually, and initiates payroll run.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  POST /api/rpa/execute
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <h4 className="text-xs font-bold text-slate-900">Backend Controller</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Express API validates input workbook schema against Employee Master database and orchestrates the UiPath execution task.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  Worker / Studio Dispatcher
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <h4 className="text-xs font-bold text-teal-900">UiPath RPA Engine</h4>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Executes Excel activities: ExcelApplicationScope, ReadRange, row-by-row formula calculation, statutory PF & Tax, and error trapping.
                </p>
                <div className="text-[10px] font-mono text-teal-900 bg-white p-2 rounded border border-teal-200">
                  UiRobot.exe --file Main.xaml
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                  <h4 className="text-xs font-bold text-slate-900">Workbook Artifacts</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Generates multi-sheet <span className="font-semibold text-slate-900">Payroll_Report.xlsx</span> with Summary, Salary Register, Deductions, and Error Log.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  Payroll_Report_2026_10.xlsx
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Activities Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                UiPath Studio Excel Activities Sequence Details
              </span>
              <span className="text-[11px] text-slate-500">Dependencies: UiPath.Excel.Activities</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0">01</span>
                <div>
                  <h4 className="font-bold text-slate-900">ExcelApplicationScope Activity</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Establishes an automated COM connection to Excel, opening the input workbook in read/write mode without crashing background processes.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0">02</span>
                <div>
                  <h4 className="font-bold text-slate-900">ReadRange Activity (`Attendance_Input` Sheet)</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Reads the tabular attendance spreadsheet into an in-memory DataTable (`dt_AttendanceInput`) including header schemas and row counts.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0">03</span>
                <div>
                  <h4 className="font-bold text-slate-900">Data Validation & Filter Row (If / Else Branch)</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Checks condition: `String.IsNullOrEmpty(empId) OrElse CDbl(row("Days Worked")) &gt; CDbl(row("Working Days"))`. Invalid rows are routed to `dt_ErrorReport` with line numbers.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0">04</span>
                <div>
                  <h4 className="font-bold text-slate-900">InvokeCode / Assign Mathematical Calculation Sequence</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Executes exact proration formulas: Basic Payable = Basic × Days Worked / Working Days; HRA (20%), DA (10%), Other Allowances, Gross, PF Deduction (12%), Tax Deduction (10%), and Net Salary.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0">05</span>
                <div>
                  <h4 className="font-bold text-slate-900">WriteRange & WriteCell Activities</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Emits the calculated DataTable `dt_SalaryRegister` into `Salary_Register` sheet and generates the executive consolidation on `Payroll_Summary`.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: College Viva & Demo Guide */}
      {activeSubTab === 'viva' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-teal-700">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Final-Year Engineering Project Defense & Viva Script</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Structured walkthrough guide for professors, academic evaluators, and external examiners:
            </p>

            <div className="space-y-6">
              {UIPATH_DEMO_GUIDE.collegePresentationFlow.map((section, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">{section.phase}</h4>
                  <p className="text-xs text-slate-600 mt-1 mb-3 leading-relaxed">{section.summary}</p>
                  
                  <div className="space-y-1.5 pl-4 border-l-2 border-teal-500">
                    {section.talkingPoints.map((pt, pIdx) => (
                      <p key={pIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-teal-600 font-bold shrink-0">·</span>
                        <span>{pt}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CLI Commands for Local Execution */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-2">How to Run via Windows Command Line / UiPath Robot CLI</h4>
              <div className="p-3 bg-slate-900 text-teal-300 font-mono text-xs rounded-lg flex items-center justify-between">
                <code>
                  "C:\Users\%USERNAME%\AppData\Local\Programs\UiPath\Studio\UiRobot.exe" execute --file "PayFlow_Automation\Main.xaml"
                </code>
                <button
                  onClick={() =>
                    handleCopy(
                      '"C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\UiPath\\Studio\\UiRobot.exe" execute --file "PayFlow_Automation\\Main.xaml"',
                      'cli'
                    )
                  }
                  className="p-1 hover:text-white transition-colors"
                >
                  {copied === 'cli' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Main.xaml Code Viewer */}
      {activeSubTab === 'xaml' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-white font-semibold">Main.xaml</span>
              <span className="text-slate-400 text-[11px]">Workflow XAML Definition</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(UIPATH_MAIN_XAML, 'xaml')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700"
              >
                {copied === 'xaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'xaml' ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={downloadMainXaml}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xaml</span>
              </button>
            </div>
          </div>

          <pre className="mt-4 p-4 bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed rounded-lg overflow-x-auto max-h-[600px]">
            {UIPATH_MAIN_XAML}
          </pre>
        </div>
      )}

      {/* TAB 4: project.json Code Viewer */}
      {activeSubTab === 'projectJson' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-white font-semibold">project.json</span>
              <span className="text-slate-400 text-[11px]">UiPath Studio Manifest</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(UIPATH_PROJECT_JSON, 'json')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700"
              >
                {copied === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'json' ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={downloadProjectJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre className="mt-4 p-4 bg-slate-950 text-teal-300 font-mono text-[11px] leading-relaxed rounded-lg overflow-x-auto max-h-[600px]">
            {UIPATH_PROJECT_JSON}
          </pre>
        </div>
      )}
    </div>
  );
};
