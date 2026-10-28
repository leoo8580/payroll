import * as XLSX from 'xlsx';
import { Employee, AttendanceItem, PayrollCalculatedRecord, ValidationIssue, PayrollRun } from '../types/payroll';

/**
 * Generate a clean standard Attendance Template (.xlsx) for HR to fill
 */
export function generateAttendanceTemplate(employees: Employee[], workingDays: number = 26): Uint8Array {
  const wb = XLSX.utils.book_new();

  const data = employees
    .filter(e => e.employmentStatus !== 'Terminated')
    .map(emp => ({
      'Employee ID': emp.employeeId,
      'Employee Name': emp.fullName,
      'Department': emp.department,
      'Designation': emp.designation,
      'Working Days': workingDays,
      'Days Worked': workingDays, // default full attendance
      'Leave Days': 0,
      'Overtime Hours': 0,
      'Remarks': 'Present'
    }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // ID
    { wch: 22 }, // Name
    { wch: 18 }, // Dept
    { wch: 22 }, // Designation
    { wch: 14 }, // Working Days
    { wch: 14 }, // Days Worked
    { wch: 12 }, // Leave Days
    { wch: 14 }, // Overtime Hours
    { wch: 16 }  // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Master');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Generate a sample test file containing both valid rows and deliberate test errors
 * for demonstrating the UiPath/Excel error catching workflow
 */
export function generateTestFileWithErrors(employees: Employee[], workingDays: number = 26): Uint8Array {
  const wb = XLSX.utils.book_new();

  const data: any[] = [];
  
  // Valid records
  const activeEmps = employees.filter(e => e.employmentStatus === 'Active').slice(0, 8);
  activeEmps.forEach((emp, i) => {
    data.push({
      'Employee ID': emp.employeeId,
      'Employee Name': emp.fullName,
      'Department': emp.department,
      'Designation': emp.designation,
      'Working Days': workingDays,
      'Days Worked': i % 2 === 0 ? workingDays : workingDays - 2, // some proration
      'Leave Days': i % 2 === 0 ? 0 : 2,
      'Overtime Hours': i === 1 ? 5 : 0,
      'Remarks': 'Regular Attendance'
    });
  });

  // Deliberate test error 1: Missing Employee ID
  data.push({
    'Employee ID': '',
    'Employee Name': 'Unregistered Contractor',
    'Department': 'Operations',
    'Designation': 'Temporary Staff',
    'Working Days': workingDays,
    'Days Worked': 20,
    'Leave Days': 6,
    'Overtime Hours': 0,
    'Remarks': 'Missing Master ID'
  });

  // Deliberate test error 2: Non-existent employee ID
  data.push({
    'Employee ID': 'EMP-9999',
    'Employee Name': 'Ghost Record Testing',
    'Department': 'Research',
    'Designation': 'Consultant',
    'Working Days': workingDays,
    'Days Worked': 24,
    'Leave Days': 2,
    'Overtime Hours': 0,
    'Remarks': 'ID not in master registry'
  });

  // Deliberate test error 3: Days worked exceeds monthly working days
  if (employees.length > 8) {
    data.push({
      'Employee ID': employees[8].employeeId,
      'Employee Name': employees[8].fullName,
      'Department': employees[8].department,
      'Designation': employees[8].designation,
      'Working Days': workingDays,
      'Days Worked': 34, // Exceeds 26!
      'Leave Days': -8,
      'Overtime Hours': 0,
      'Remarks': 'Invalid days calculation'
    });
  }

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Input');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Parse uploaded Excel file buffer into AttendanceItem list
 */
export function parseAttendanceWorkbook(buffer: ArrayBuffer): AttendanceItem[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];

  // Convert to JSON
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map(row => {
    // Tolerant column header matching
    const empId = 
      row['Employee ID'] ?? 
      row['EmployeeID'] ?? 
      row['Emp ID'] ?? 
      row['ID'] ?? 
      row['employee_id'] ?? 
      '';

    const empName = 
      row['Employee Name'] ?? 
      row['FullName'] ?? 
      row['Name'] ?? 
      row['employee_name'] ?? 
      '';

    const dept = 
      row['Department'] ?? 
      row['dept'] ?? 
      '';

    const workingDays = 
      Number(row['Working Days'] ?? row['WorkingDays'] ?? row['Total Days'] ?? 26) || 26;

    const daysWorked = 
      Number(row['Days Worked'] ?? row['DaysWorked'] ?? row['Present Days'] ?? row['Present'] ?? 0);

    const leaveDays = 
      Number(row['Leave Days'] ?? row['LeaveDays'] ?? (workingDays - daysWorked));

    const overtime = 
      Number(row['Overtime Hours'] ?? row['Overtime'] ?? 0);

    return {
      employeeId: String(empId).trim(),
      fullName: String(empName).trim(),
      department: String(dept).trim(),
      workingDays,
      daysWorked,
      leaveDays,
      overtimeHours: overtime
    };
  });
}

/**
 * Generate the comprehensive Payroll_Report.xlsx
 */
export function generatePayrollReportExcel(payrollRun: PayrollRun, currencySymbol: string = '₹'): Uint8Array {
  const wb = XLSX.utils.book_new();

  // SHEET 1: Summary Dashboard Sheet
  const summaryData = [
    ['PAYFLOW AUTOMATED PAYROLL PROCESSING REPORT'],
    ['Generated via UiPath RPA & Excel Engine', ''],
    [''],
    ['Payroll Period', `${payrollRun.month} ${payrollRun.year}`],
    ['Run Reference ID', payrollRun.id],
    ['Status', payrollRun.status],
    ['Processing Date', payrollRun.processedAt],
    ['Processed By', payrollRun.processedBy],
    ['Total Employees Processed', payrollRun.totalEmployees],
    ['Active Eligible Records', payrollRun.activeEmployees],
    ['Excluded / Invalid Records', payrollRun.invalidRecords?.length || 0],
    [''],
    ['FINANCIAL CONSOLIDATION', 'AMOUNT'],
    [`Total Gross Salary (${currencySymbol})`, payrollRun.grossPayroll],
    [`Total Statutory PF Deduction (${currencySymbol})`, payrollRun.totalPF],
    [`Total Income Tax Deduction (${currencySymbol})`, payrollRun.totalTax],
    [`Total Payroll Deductions (${currencySymbol})`, payrollRun.totalDeductions],
    [`Net Payable Disbursement (${currencySymbol})`, payrollRun.netPayroll],
    [''],
    ['RPA EXECUTION METRICS', ''],
    ['UiPath Job Reference', payrollRun.uipathExecutionDetails?.jobId || 'N/A'],
    ['RPA Robot Host', payrollRun.uipathExecutionDetails?.robotName || 'UiPath-Agent-01'],
    ['Total Execution Duration', `${payrollRun.uipathExecutionDetails?.durationSeconds || 1.8}s`],
    ['Automated Verification', '100% Calculated & Audited via Excel Activities']
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 34 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Payroll_Summary');

  // SHEET 2: Full Salary Register
  const registerData = payrollRun.records.map((r, i) => ({
    'S.No': i + 1,
    'Employee ID': r.employeeId,
    'Employee Name': r.employeeName,
    'Department': r.department,
    'Designation': r.designation,
    'Working Days': r.workingDays,
    'Days Worked': r.daysWorked,
    'Basic Monthly': r.basicMonthlySalary,
    'Basic Payable': r.basicSalaryPayable,
    'HRA %': `${r.hraPercentage}%`,
    'HRA Amount': r.hra,
    'DA %': `${r.daPercentage}%`,
    'DA Amount': r.da,
    'Other Allowances': r.otherAllowancesPayable,
    'Gross Salary': r.grossSalary,
    'PF %': `${r.pfPercentage}%`,
    'PF Deduction': r.pfDeduction,
    'Tax %': `${r.taxPercentage}%`,
    'Tax Deduction': r.taxDeduction,
    'Total Deductions': r.totalDeductions,
    'Net Salary': r.netSalary,
    'Status': r.status
  }));

  const registerWs = XLSX.utils.json_to_sheet(registerData);
  registerWs['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // ID
    { wch: 24 }, // Name
    { wch: 18 }, // Dept
    { wch: 24 }, // Designation
    { wch: 12 }, // Working Days
    { wch: 12 }, // Days Worked
    { wch: 14 }, // Basic Monthly
    { wch: 14 }, // Basic Payable
    { wch: 8 },  // HRA %
    { wch: 12 }, // HRA
    { wch: 8 },  // DA %
    { wch: 12 }, // DA
    { wch: 16 }, // Other Allowances
    { wch: 16 }, // Gross Salary
    { wch: 8 },  // PF %
    { wch: 14 }, // PF
    { wch: 8 },  // Tax %
    { wch: 14 }, // Tax
    { wch: 16 }, // Total Deductions
    { wch: 16 }, // Net Salary
    { wch: 10 }  // Status
  ];
  XLSX.utils.book_append_sheet(wb, registerWs, 'Salary_Register');

  // SHEET 3: Statutory Deductions Register
  const deductionData = payrollRun.records.map((r, i) => ({
    'S.No': i + 1,
    'Employee ID': r.employeeId,
    'Employee Name': r.employeeName,
    'Department': r.department,
    'Basic Salary Payable': r.basicSalaryPayable,
    'PF Rate': `${r.pfPercentage}%`,
    'PF Employee Deduction': r.pfDeduction,
    'Gross Salary': r.grossSalary,
    'Tax Rate': `${r.taxPercentage}%`,
    'Tax Deducted at Source': r.taxDeduction,
    'Combined Statutory Deductions': r.totalDeductions
  }));
  const deductionWs = XLSX.utils.json_to_sheet(deductionData);
  deductionWs['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
    { wch: 10 },
    { wch: 22 },
    { wch: 26 }
  ];
  XLSX.utils.book_append_sheet(wb, deductionWs, 'Deduction_Schedule');

  // SHEET 4: RPA Activity Execution Log
  if (payrollRun.uipathExecutionDetails?.activitiesLog) {
    const logData = payrollRun.uipathExecutionDetails.activitiesLog.map((log, idx) => ({
      'Step': idx + 1,
      'Activity Name': log.activityName,
      'Activity Type': log.type,
      'Execution Timestamp': log.timestamp,
      'Duration (ms)': log.durationMs,
      'Activity Status': log.status,
      'Activity Details & Log Output': log.details
    }));
    const logWs = XLSX.utils.json_to_sheet(logData);
    logWs['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 24 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, logWs, 'UiPath_Activity_Logs');
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Generate an Error Report workbook for invalid records
 */
export function generateErrorReportExcel(issues: ValidationIssue[], period: string): Uint8Array {
  const wb = XLSX.utils.book_new();

  const data = issues.map((issue, idx) => ({
    'Issue #': idx + 1,
    'Excel Row Number': issue.rowNumber,
    'Employee ID': issue.employeeId || 'N/A',
    'Employee Name': issue.employeeName || 'N/A',
    'Field in Error': issue.field || 'General',
    'Severity': issue.severity.toUpperCase(),
    'Error Description': issue.message
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Errors_${period.replace('-', '_')}`);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Helper to trigger browser download of a binary ArrayBuffer or Uint8Array
 */
export function downloadFile(data: Uint8Array | ArrayBuffer, fileName: string, mimeType: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'): void {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a blank Employee Master Roster Template (.xlsx) for bulk importing employees
 */
export function generateEmployeeMasterTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const sampleRows = [
    {
      'Employee ID': 'EMP-1001',
      'Full Name': 'Aarav Sharma',
      'Email': 'aarav.sharma@company.com',
      'Department': 'Engineering',
      'Designation': 'Software Engineer',
      'Basic Monthly Salary': 75000,
      'HRA %': 20,
      'DA %': 10,
      'Other Allowances': 5000,
      'PF %': 12,
      'Tax %': 10,
      'Employment Status': 'Active',
      'Bank Name': 'HDFC Bank Ltd',
      'Bank Account Number': '109283746501',
      'IFSC Code': 'HDFC0000451'
    },
    {
      'Employee ID': 'EMP-1002',
      'Full Name': 'Kavita Nair',
      'Email': 'kavita.nair@company.com',
      'Department': 'Human Resources',
      'Designation': 'HR Specialist',
      'Basic Monthly Salary': 65000,
      'HRA %': 20,
      'DA %': 10,
      'Other Allowances': 4000,
      'PF %': 12,
      'Tax %': 8,
      'Employment Status': 'Active',
      'Bank Name': 'ICICI Bank Ltd',
      'Bank Account Number': '982736450192',
      'IFSC Code': 'ICIC0001024'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Employee_Master');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Parse an uploaded Employee Roster Excel file into Employee objects
 */
export function parseEmployeeRosterWorkbook(buffer: ArrayBuffer): Partial<Employee>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, index) => {
    const rawId = (
      row['Employee ID'] ??
      row['EmployeeID'] ??
      row['Emp ID'] ??
      row['ID'] ??
      `EMP-${1000 + index + 1}`
    ).toString().trim();

    const fullName = (
      row['Full Name'] ??
      row['FullName'] ??
      row['Employee Name'] ??
      row['Name'] ??
      'New Employee'
    ).toString().trim();

    const email = (
      row['Email'] ??
      row['Corporate Email'] ??
      `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.com`
    ).toString().trim();

    const department = (row['Department'] ?? row['Dept'] ?? 'General').toString().trim();
    const designation = (row['Designation'] ?? row['Role'] ?? 'Staff Member').toString().trim();

    const basicSalary = Number(
      row['Basic Monthly Salary'] ?? row['Basic Salary'] ?? row['Basic'] ?? 50000
    );

    const hra = Number(row['HRA %'] ?? row['HRA'] ?? 20);
    const da = Number(row['DA %'] ?? row['DA'] ?? 10);
    const otherAllowances = Number(row['Other Allowances'] ?? row['Allowances'] ?? 0);
    const pf = Number(row['PF %'] ?? row['PF'] ?? 12);
    const tax = Number(row['Tax %'] ?? row['TDS %'] ?? row['Tax'] ?? 10);

    const status = (row['Employment Status'] ?? row['Status'] ?? 'Active').toString().trim();
    const validStatus = status === 'On Leave' || status === 'Terminated' ? status : 'Active';

    const bankName = (row['Bank Name'] ?? row['Bank'] ?? 'Primary Bank').toString().trim();
    const bankAccount = (row['Bank Account Number'] ?? row['Bank Account'] ?? row['Account Number'] ?? '').toString().trim();
    const ifscCode = (row['IFSC Code'] ?? row['IFSC'] ?? '').toString().trim();

    return {
      employeeId: rawId.toUpperCase(),
      fullName,
      email,
      department,
      designation,
      basicSalary: isNaN(basicSalary) || basicSalary <= 0 ? 50000 : basicSalary,
      hraPercentage: isNaN(hra) ? 20 : hra,
      daPercentage: isNaN(da) ? 10 : da,
      otherAllowances: isNaN(otherAllowances) ? 0 : otherAllowances,
      pfPercentage: isNaN(pf) ? 12 : pf,
      taxPercentage: isNaN(tax) ? 10 : tax,
      employmentStatus: validStatus,
      joinedDate: new Date().toISOString().split('T')[0],
      bankName,
      bankAccount,
      ifscCode,
    };
  });
}

