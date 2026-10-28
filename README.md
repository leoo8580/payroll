# PayFlow — Automated Excel-Based Payroll Preparation System

**Academic Final-Year Project**: *Automated Excel-Based Payroll Preparation Using UiPath and Excel*  
**Architecture**: React SPA + Express.js REST API + UiPath RPA Engine + ExcelJS/XLSX  
**Role**: Lead Full-Stack Developer & UiPath RPA Engineer  

---

## 1. Executive Summary

**PayFlow** is a modern, enterprise HR & Payroll Management SaaS application built to automate end-to-end payroll processing from raw attendance workbooks. It integrates deterministic Excel activity automation with a web application, providing automated data validation, proration calculation, error trapping, and multi-sheet reporting.

---

## 2. System Architecture

```
[HR User / Web UI] ──(Upload Attendance Excel)──> [Express.js Controller]
                                                         │
                                               (Cross-Check Master DB)
                                                         │
                                                         ▼
[Multi-Sheet Payroll_Report.xlsx] <──(COM Automation)── [UiPath RPA Engine]
  ├── Payroll_Summary                                    (Main.xaml)
  ├── Salary_Register
  ├── Deduction_Schedule
  └── UiPath_Activity_Logs
```

### Components:
1. **Frontend Web Application (React + Vite + Tailwind CSS)**:
   - Fixed left sidebar navigation with enterprise hierarchy.
   - 4-KPI Overview Dashboard with dynamic period-to-period delta calculations.
   - Master Employee Directory with complete CRUD, filtering, sorting, and salary structure modals.
   - 4-Step Guided Payroll Preparation Wizard.
   - Persistent Historical Payroll Runs with rollback and Excel download.
   - Multi-tab Financial Reports (Department, Deductions, Attendance Proration).
   - UiPath RPA Center with XAML code inspection, `project.json` manifest, and college viva presentation guide.
   - System Settings with configurable currency (INR ₹, USD, EUR, GBP) and statutory formula percentages.

2. **Backend Server (`server.ts` - Node.js Express)**:
   - Full REST API with persistent disk storage (`data/store.json`).
   - UiPath execution trigger endpoint `/api/rpa/execute`.
   - Excel workbook generation for templates, test workbooks with errors, and error logs.

3. **UiPath RPA Engine (`Main.xaml` & `project.json`)**:
   - `ExcelApplicationScope`: Initializes Excel automation session.
   - `ReadRange`: Ingests `Attendance_Input.xlsx`.
   - `ForEachRow`: Performs row-by-row validation (detects empty IDs, non-existent employees, and days worked exceeding monthly bounds).
   - `InvokeCode / Assign`: Executes mathematical formulas and compiles `dt_SalaryRegister` and `dt_ErrorReport`.
   - `WriteRange`: Emits multi-sheet `Payroll_Report.xlsx`.

---

## 3. Mathematical Payroll Formulas

All calculations use strict 2-decimal place precision:

1. **Basic Salary Payable**:
   $$\text{Basic Payable} = \text{Basic Salary} \times \frac{\text{Days Worked}}{\text{Working Days}}$$

2. **House Rent Allowance (HRA)**:
   $$\text{HRA} = \text{Basic Payable} \times \frac{\text{HRA \%}}{100}$$

3. **Dearness Allowance (DA)**:
   $$\text{DA} = \text{Basic Payable} \times \frac{\text{DA \%}}{100}$$

4. **Other Allowances Payable**:
   $$\text{Allowances Payable} = \text{Other Allowances} \times \frac{\text{Days Worked}}{\text{Working Days}}$$

5. **Gross Salary**:
   $$\text{Gross} = \text{Basic Payable} + \text{HRA} + \text{DA} + \text{Allowances Payable}$$

6. **Provident Fund (PF) Statutory Deduction**:
   $$\text{PF Deduction} = \text{Basic Payable} \times \frac{\text{PF \%}}{100}$$

7. **Tax Deducted at Source (TDS)**:
   $$\text{Tax Deduction} = \text{Gross Salary} \times \frac{\text{Tax \%}}{100}$$

8. **Total Deductions**:
   $$\text{Total Deductions} = \text{PF Deduction} + \text{Tax Deduction}$$

9. **Net Salary**:
   $$\text{Net Salary} = \text{Gross Salary} - \text{Total Deductions}$$

---

## 4. College Project Demonstration Script (Viva Walkthrough)

1. **Overview Dashboard**:
   - Show Total Workforce (16 Employees), Net Payroll Disbursed, Deductions, and Average Net Salary.
   - Highlight the Recharts trend chart showing period-over-period financial evolution.

2. **Employee Directory**:
   - Filter by Department (e.g. Engineering, HR, Finance) and Employment Status.
   - Open any employee drawer to view the component breakdown.

3. **Step-by-Step Payroll Wizard**:
   - **Step 1**: Select October 2026, set 26 working days.
   - **Step 2**: Click **"Load Test File with Errors"** to demonstrate automatic detection of missing employee IDs and invalid days worked. Highlight the Error Report.
   - **Step 3**: Review mathematical calculations in the spreadsheet table. Click a row to show the step-by-step formula trace drawer.
   - **Step 4**: Click **"Execute UiPath RPA Pipeline"** to trigger the automated activity sequence. Download the generated `Payroll_Report.xlsx` workbook and inspect the 4 sheets. Finish and save to history.

4. **UiPath RPA Center**:
   - Show the architecture diagram, inspect `Main.xaml` and `project.json`, and demonstrate local CLI invocation using `UiRobot.exe`.
