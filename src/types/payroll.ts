export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated';

export interface Employee {
  id: string;
  employeeId: string; // e.g. EMP-1001
  fullName: string;
  email: string;
  department: string;
  designation: string;
  basicSalary: number;
  hraPercentage: number; // e.g. 20
  daPercentage: number; // e.g. 10
  otherAllowances: number; // fixed amount, e.g. 5000
  pfPercentage: number; // e.g. 12
  taxPercentage: number; // e.g. 10
  employmentStatus: EmploymentStatus;
  joinedDate: string;
  bankAccount: string;
  bankName: string;
  ifscCode: string;
}

export interface AttendanceItem {
  employeeId: string;
  fullName?: string;
  department?: string;
  workingDays: number;
  daysWorked: number;
  leaveDays: number;
  overtimeHours?: number;
}

export interface ValidationIssue {
  rowNumber: number;
  employeeId?: string;
  employeeName?: string;
  field?: string;
  value?: any;
  severity: 'error' | 'warning';
  message: string;
}

export interface PayrollCalculatedRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  workingDays: number;
  daysWorked: number;
  leaveDays: number;
  basicMonthlySalary: number;
  basicSalaryPayable: number;
  hraPercentage: number;
  hra: number;
  daPercentage: number;
  da: number;
  otherAllowancesMonthly: number;
  otherAllowancesPayable: number;
  grossSalary: number;
  pfPercentage: number;
  pfDeduction: number;
  taxPercentage: number;
  taxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Valid' | 'Warning' | 'Error';
  validationNotes?: string[];
}

export interface UiPathActivityLog {
  activityId: string;
  activityName: string;
  type: string;
  timestamp: string;
  durationMs: number;
  status: 'Success' | 'Warning' | 'Error';
  details: string;
}

export interface UiPathExecutionDetails {
  jobId: string;
  robotName: string;
  hostName: string;
  workflowVersion: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  recordsProcessed: number;
  validRecordsCount: number;
  invalidRecordsCount: number;
  outputWorkbookName: string;
  outputFileSizeBytes: number;
  activitiesLog: UiPathActivityLog[];
}

export interface PayrollRun {
  id: string; // e.g. 'PAY-2026-10'
  month: string; // e.g. 'October'
  year: number; // e.g. 2026
  periodKey: string; // '2026-10'
  processedAt: string;
  processedBy: string;
  totalEmployees: number;
  activeEmployees: number;
  grossPayroll: number;
  totalDeductions: number;
  totalPF: number;
  totalTax: number;
  netPayroll: number;
  status: 'Draft' | 'Finalized' | 'Paid';
  records: PayrollCalculatedRecord[];
  invalidRecords: ValidationIssue[];
  uipathExecutionDetails?: UiPathExecutionDetails;
}

export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  taxRegistrationNumber: string;
  currency: string;
  currencySymbol: string;
  defaultWorkingDays: number;
  defaultHraPercentage: number;
  defaultDaPercentage: number;
  defaultPfPercentage: number;
  defaultTaxPercentage: number;
  uipathIntegrationMode: 'local_engine' | 'orchestrator_api';
  orchestratorUrl: string;
  orchestratorTenant: string;
}

export type ActiveTab = 
  | 'overview' 
  | 'employees' 
  | 'payroll-processing' 
  | 'payroll-history' 
  | 'reports' 
  | 'uipath-center' 
  | 'settings';
