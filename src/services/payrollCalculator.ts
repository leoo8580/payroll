import { Employee, AttendanceItem, PayrollCalculatedRecord, ValidationIssue } from '../types/payroll';

/**
 * Rounds a number to exactly two decimal places
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a currency number with symbol and locale
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export interface CalculationInput {
  employee: Employee;
  workingDays: number;
  daysWorked: number;
  leaveDays?: number;
}

/**
 * Calculates salary components according to specified formula
 */
export function computeEmployeePayroll(
  input: CalculationInput
): PayrollCalculatedRecord {
  const { employee, workingDays, daysWorked, leaveDays = 0 } = input;

  const validWorkingDays = workingDays > 0 ? workingDays : 26;
  const clampedDaysWorked = Math.max(0, Math.min(daysWorked, validWorkingDays));

  // Formulas:
  // 1. Basic Salary Payable = Basic Salary × Days Worked / Working Days
  const basicSalaryPayable = round2(
    (employee.basicSalary * clampedDaysWorked) / validWorkingDays
  );

  // 2. HRA = Basic Salary Payable × HRA Percentage / 100
  const hra = round2((basicSalaryPayable * (employee.hraPercentage || 0)) / 100);

  // 3. DA = Basic Salary Payable × DA Percentage / 100
  const da = round2((basicSalaryPayable * (employee.daPercentage || 0)) / 100);

  // 4. Other Allowances Payable = Other Allowances × Days Worked / Working Days
  const otherAllowancesPayable = round2(
    ((employee.otherAllowances || 0) * clampedDaysWorked) / validWorkingDays
  );

  // 5. Gross Salary = Basic Salary Payable + HRA + DA + Other Allowances Payable
  const grossSalary = round2(
    basicSalaryPayable + hra + da + otherAllowancesPayable
  );

  // 6. PF Deduction = Basic Salary Payable × PF Percentage / 100
  const pfDeduction = round2(
    (basicSalaryPayable * (employee.pfPercentage || 0)) / 100
  );

  // 7. Tax Deduction = Gross Salary × Tax Percentage / 100
  const taxDeduction = round2(
    (grossSalary * (employee.taxPercentage || 0)) / 100
  );

  // 8. Total Deductions = PF Deduction + Tax Deduction
  const totalDeductions = round2(pfDeduction + taxDeduction);

  // 9. Net Salary = Gross Salary − Total Deductions
  const netSalary = round2(grossSalary - totalDeductions);

  const validationNotes: string[] = [];
  let status: 'Valid' | 'Warning' | 'Error' = 'Valid';

  if (clampedDaysWorked < validWorkingDays) {
    validationNotes.push(`Prorated for ${clampedDaysWorked}/${validWorkingDays} days worked`);
  }
  if (employee.employmentStatus === 'On Leave') {
    validationNotes.push('Employee is currently on approved leave');
    status = 'Warning';
  }
  if (employee.employmentStatus === 'Terminated') {
    validationNotes.push('Employee is marked as terminated');
    status = 'Error';
  }

  return {
    employeeId: employee.employeeId,
    employeeName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    workingDays: validWorkingDays,
    daysWorked: clampedDaysWorked,
    leaveDays: leaveDays || Math.max(0, validWorkingDays - clampedDaysWorked),
    basicMonthlySalary: round2(employee.basicSalary),
    basicSalaryPayable,
    hraPercentage: employee.hraPercentage,
    hra,
    daPercentage: employee.daPercentage,
    da,
    otherAllowancesMonthly: round2(employee.otherAllowances || 0),
    otherAllowancesPayable,
    grossSalary,
    pfPercentage: employee.pfPercentage,
    pfDeduction,
    taxPercentage: employee.taxPercentage,
    taxDeduction,
    totalDeductions,
    netSalary,
    status,
    validationNotes,
  };
}

/**
 * Validate imported records against employee master database
 */
export function validateAttendanceRecords(
  importedAttendance: AttendanceItem[],
  masterEmployees: Employee[],
  workingDaysMonth: number
): {
  validRecords: AttendanceItem[];
  invalidIssues: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const validRecords: AttendanceItem[] = [];
  const invalidIssues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const employeeMap = new Map<string, Employee>();

  masterEmployees.forEach((emp) => {
    employeeMap.set(emp.employeeId.trim().toUpperCase(), emp);
  });

  const seenIds = new Set<string>();

  importedAttendance.forEach((item, index) => {
    const rowNumber = index + 2; // header is row 1
    const rawId = (item.employeeId || '').toString().trim().toUpperCase();

    if (!rawId) {
      invalidIssues.push({
        rowNumber,
        severity: 'error',
        field: 'Employee ID',
        message: 'Employee ID is empty or missing',
      });
      return;
    }

    if (seenIds.has(rawId)) {
      invalidIssues.push({
        rowNumber,
        employeeId: rawId,
        employeeName: item.fullName,
        severity: 'error',
        field: 'Employee ID',
        message: `Duplicate attendance record detected for employee ${rawId}`,
      });
      return;
    }
    seenIds.add(rawId);

    const master = employeeMap.get(rawId);
    if (!master) {
      invalidIssues.push({
        rowNumber,
        employeeId: rawId,
        employeeName: item.fullName,
        severity: 'error',
        field: 'Employee ID',
        message: `Employee ID ${rawId} does not exist in master employee directory`,
      });
      return;
    }

    if (master.employmentStatus === 'Terminated') {
      invalidIssues.push({
        rowNumber,
        employeeId: rawId,
        employeeName: master.fullName,
        severity: 'error',
        field: 'Employment Status',
        message: `Employee ${rawId} is marked as Terminated in master records`,
      });
      return;
    }

    const workingDays = Number(item.workingDays) || workingDaysMonth;
    const daysWorked = Number(item.daysWorked);

    if (isNaN(daysWorked) || daysWorked < 0) {
      invalidIssues.push({
        rowNumber,
        employeeId: rawId,
        employeeName: master.fullName,
        severity: 'error',
        field: 'Days Worked',
        value: item.daysWorked,
        message: `Invalid days worked value "${item.daysWorked}". Must be a non-negative number.`,
      });
      return;
    }

    if (daysWorked > workingDays) {
      invalidIssues.push({
        rowNumber,
        employeeId: rawId,
        employeeName: master.fullName,
        severity: 'error',
        field: 'Days Worked',
        value: daysWorked,
        message: `Days worked (${daysWorked}) cannot exceed working days (${workingDays})`,
      });
      return;
    }

    if (daysWorked === 0) {
      warnings.push({
        rowNumber,
        employeeId: rawId,
        employeeName: master.fullName,
        severity: 'warning',
        field: 'Days Worked',
        value: 0,
        message: `Employee has 0 days worked. Net salary will be zero.`,
      });
    }

    validRecords.push({
      employeeId: master.employeeId,
      fullName: master.fullName,
      department: master.department,
      workingDays,
      daysWorked,
      leaveDays: workingDays - daysWorked,
      overtimeHours: Number(item.overtimeHours) || 0,
    });
  });

  return { validRecords, invalidIssues, warnings };
}
