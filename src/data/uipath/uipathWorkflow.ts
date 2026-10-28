export const UIPATH_PROJECT_JSON = `{
  "name": "PayFlow_Automated_Payroll_Preparation",
  "description": "Automated Excel-Based Payroll Preparation System using UiPath Studio and Excel Activities.",
  "main": "Main.xaml",
  "dependencies": {
    "UiPath.Excel.Activities": "[2.23.4]",
    "UiPath.System.Activities": "[24.10.1]",
    "UiPath.UIAutomation.Activities": "[24.10.0]"
  },
  "webServices": [],
  "entitiesStores": [],
  "schemaVersion": "4.0",
  "studioVersion": "24.10.0.0",
  "projectVersion": "1.0.0",
  "runtimeOptions": {
    "autoDispose": false,
    "netFrameworkSetupNotification": false
  },
  "designOptions": {
    "projectProfile": "Developement",
    "outputType": "Process",
    "libraryOptions": {
      "includeOriginalXaml": false,
      "privateWorkflows": []
    },
    "processOptions": {
      "ignoredFiles": []
    },
    "fileInfoCollection": []
  },
  "expressionLanguage": "VisualBasic",
  "entryPoints": [
    {
      "filePath": "Main.xaml",
      "uniqueId": "b1827c12-3201-4890-a549-018274619283",
      "input": [
        {
          "name": "in_InputWorkbookPath",
          "type": "System.String, mscorlib, Version=4.0.0.0",
          "required": false
        },
        {
          "name": "in_WorkingDays",
          "type": "System.Int32, mscorlib, Version=4.0.0.0",
          "required": false
        },
        {
          "name": "in_PayrollPeriod",
          "type": "System.String, mscorlib, Version=4.0.0.0",
          "required": false
        }
      ],
      "output": [
        {
          "name": "out_OutputReportPath",
          "type": "System.String, mscorlib, Version=4.0.0.0"
        },
        {
          "name": "out_TotalGrossPayroll",
          "type": "System.Double, mscorlib, Version=4.0.0.0"
        },
        {
          "name": "out_TotalNetPayroll",
          "type": "System.Double, mscorlib, Version=4.0.0.0"
        },
        {
          "name": "out_ValidRecordsCount",
          "type": "System.Int32, mscorlib, Version=4.0.0.0"
        },
        {
          "name": "out_InvalidRecordsCount",
          "type": "System.Int32, mscorlib, Version=4.0.0.0"
        }
      ]
    }
  ]
}`;

export const UIPATH_MAIN_XAML = `<?xml version="1.0" encoding="utf-8"?>
<Activity mc:Ignorable="sap sap2010" x:Class="Main"
  xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:mva="clr-namespace:Microsoft.VisualBasic.Activities;assembly=System.Activities"
  xmlns:sap="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation"
  xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation"
  xmlns:scg="clr-namespace:System.Collections.Generic;assembly=mscorlib"
  xmlns:sd="clr-namespace:System.Data;assembly=System.Data"
  xmlns:ui="http://schemas.uipath.com/workflow/activities"
  xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  <x:Members>
    <x:Property Name="in_InputWorkbookPath" Type="InArgument(x:String)" />
    <x:Property Name="in_WorkingDays" Type="InArgument(x:Int32)" />
    <x:Property Name="in_PayrollPeriod" Type="InArgument(x:String)" />
    <x:Property Name="out_OutputReportPath" Type="OutArgument(x:String)" />
    <x:Property Name="out_TotalGrossPayroll" Type="OutArgument(x:Double)" />
    <x:Property Name="out_TotalNetPayroll" Type="OutArgument(x:Double)" />
    <x:Property Name="out_ValidRecordsCount" Type="OutArgument(x:Int32)" />
    <x:Property Name="out_InvalidRecordsCount" Type="OutArgument(x:Int32)" />
  </x:Members>
  <VisualBasic.Settings>
    <x:Null />
  </VisualBasic.Settings>
  <Sequence DisplayName="PayFlow Automated Payroll Sequence" sap:VirtualizedContainerService.HintSize="840,3200">
    <Sequence.Variables>
      <Variable x:TypeArguments="sd:DataTable" Name="dt_AttendanceInput" />
      <Variable x:TypeArguments="sd:DataTable" Name="dt_EmployeeMaster" />
      <Variable x:TypeArguments="sd:DataTable" Name="dt_SalaryRegister" />
      <Variable x:TypeArguments="sd:DataTable" Name="dt_ErrorReport" />
      <Variable x:TypeArguments="x:String" Default="Payroll_Report.xlsx" Name="var_OutputPath" />
      <Variable x:TypeArguments="x:Double" Default="0" Name="var_GrossAccumulator" />
      <Variable x:TypeArguments="x:Double" Default="0" Name="var_NetAccumulator" />
      <Variable x:TypeArguments="x:Int32" Default="0" Name="var_ValidCount" />
      <Variable x:TypeArguments="x:Int32" Default="0" Name="var_InvalidCount" />
    </Sequence.Variables>

    <!-- Step 1: Log Initialization -->
    <ui:LogMessage DisplayName="Log Initialization" Level="Info" 
      Message="[&quot;[PayFlow RPA] Starting Payroll Automation for Period: &quot; + in_PayrollPeriod]" />

    <!-- Step 2: Excel Application Scope to Read Attendance -->
    <ui:ExcelApplicationScope Password="{x:Null}" DisplayName="Scope: Input Attendance Workbook" 
      WorkbookPath="[If(String.IsNullOrEmpty(in_InputWorkbookPath), &quot;Employee_Attendance_Input.xlsx&quot;, in_InputWorkbookPath)]">
      <ui:ExcelApplicationScope.Body>
        <ActivityAction x:TypeArguments="ui:WorkbookApplication">
          <ActivityAction.Argument>
            <DelegateInArgument x:TypeArguments="ui:WorkbookApplication" Name="ExcelScope" />
          </ActivityAction.Argument>
          <Sequence DisplayName="Read Attendance Data">
            <ui:ExcelReadRange AddHeaders="True" DataTable="[dt_AttendanceInput]" DisplayName="Read Attendance_Input Sheet" SheetName="Attendance_Input" />
          </Sequence>
        </ActivityAction>
      </ui:ExcelApplicationScope.Body>
    </ui:ExcelApplicationScope>

    <!-- Step 3: Build Salary Register and Error Tables -->
    <ui:BuildDataTable DataTable="[dt_SalaryRegister]" DisplayName="Build dt_SalaryRegister Schema" 
      TableInfo="&lt;NewDataSet&gt;&lt;xs:schema id=&quot;SalaryRegister&quot; ...&gt;&lt;/xs:schema&gt;&lt;/NewDataSet&gt;" />
    <ui:BuildDataTable DataTable="[dt_ErrorReport]" DisplayName="Build dt_ErrorReport Schema" 
      TableInfo="&lt;NewDataSet&gt;&lt;xs:schema id=&quot;ErrorReport&quot; ...&gt;&lt;/xs:schema&gt;&lt;/NewDataSet&gt;" />

    <!-- Step 4: Iteration and Calculation Loop -->
    <ui:ForEachRow CurrentIndex="{x:Null}" DataTable="[dt_AttendanceInput]" DisplayName="For Each Attendance Row in Input">
      <ui:ForEachRow.Body>
        <ActivityAction x:TypeArguments="sd:DataRow">
          <ActivityAction.Argument>
            <DelegateInArgument x:TypeArguments="sd:DataRow" Name="row" />
          </ActivityAction.Argument>
          <Sequence DisplayName="Validate and Compute Row">
            <Sequence.Variables>
              <Variable x:TypeArguments="x:String" Name="empId" />
              <Variable x:TypeArguments="x:Double" Name="workingDays" />
              <Variable x:TypeArguments="x:Double" Name="daysWorked" />
              <Variable x:TypeArguments="x:Double" Name="basicSalary" />
              <Variable x:TypeArguments="x:Double" Name="basicPayable" />
              <Variable x:TypeArguments="x:Double" Name="hraAmount" />
              <Variable x:TypeArguments="x:Double" Name="daAmount" />
              <Variable x:TypeArguments="x:Double" Name="otherAllowancesPayable" />
              <Variable x:TypeArguments="x:Double" Name="grossSalary" />
              <Variable x:TypeArguments="x:Double" Name="pfDeduction" />
              <Variable x:TypeArguments="x:Double" Name="taxDeduction" />
              <Variable x:TypeArguments="x:Double" Name="totalDeductions" />
              <Variable x:TypeArguments="x:Double" Name="netSalary" />
              <Variable x:TypeArguments="x:Boolean" Name="isValid" />
            </Sequence.Variables>

            <!-- Extraction -->
            <Assign DisplayName="Extract Employee ID">
              <Assign.To><OutArgument x:TypeArguments="x:String">[empId]</OutArgument></Assign.To>
              <Assign.Value><InArgument x:TypeArguments="x:String">[row("Employee ID").ToString.Trim]</InArgument></Assign.Value>
            </Assign>

            <!-- Validation Condition -->
            <If Condition="[String.IsNullOrEmpty(empId) OrElse CDbl(row(&quot;Days Worked&quot;)) &gt; CDbl(row(&quot;Working Days&quot;))]" DisplayName="Check If Row is Valid">
              <If.Then>
                <Sequence DisplayName="Handle Invalid Row">
                  <Assign><Assign.To><OutArgument x:TypeArguments="x:Int32">[var_InvalidCount]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Int32">[var_InvalidCount + 1]</InArgument></Assign.Value></Assign>
                  <ui:AddDataRow ArrayRow="[{ empId, &quot;Validation Failed: Invalid ID or Days Worked exceeds Working Days&quot; }]" DataTable="[dt_ErrorReport]" DisplayName="Add Row to dt_ErrorReport" />
                </Sequence>
              </If.Then>
              <If.Else>
                <Sequence DisplayName="Calculate Payroll Formulas">
                  <Assign DisplayName="Parse Working Days">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[workingDays]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[If(in_WorkingDays &gt; 0, CDbl(in_WorkingDays), CDbl(row("Working Days")))]</InArgument></Assign.Value>
                  </Assign>
                  <Assign DisplayName="Parse Days Worked">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[daysWorked]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[CDbl(row("Days Worked"))]</InArgument></Assign.Value>
                  </Assign>
                  
                  <!-- Basic Salary Payable = Basic Salary * Days Worked / Working Days -->
                  <Assign DisplayName="Compute Basic Payable">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[basicPayable]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round((basicSalary * daysWorked) / workingDays, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- HRA = Basic Payable * HRA% / 100 -->
                  <Assign DisplayName="Compute HRA">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[hraAmount]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round((basicPayable * 20.0) / 100.0, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- DA = Basic Payable * DA% / 100 -->
                  <Assign DisplayName="Compute DA">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[daAmount]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round((basicPayable * 10.0) / 100.0, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- Gross Salary = Basic Payable + HRA + DA + Other Allowances -->
                  <Assign DisplayName="Compute Gross Salary">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[grossSalary]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round(basicPayable + hraAmount + daAmount + otherAllowancesPayable, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- PF Deduction = Basic Payable * PF% / 100 -->
                  <Assign DisplayName="Compute PF Deduction">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[pfDeduction]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round((basicPayable * 12.0) / 100.0, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- Tax Deduction = Gross Salary * Tax% / 100 -->
                  <Assign DisplayName="Compute Tax Deduction">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[taxDeduction]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round((grossSalary * 10.0) / 100.0, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- Total Deductions = PF + Tax -->
                  <Assign DisplayName="Compute Total Deductions">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[totalDeductions]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round(pfDeduction + taxDeduction, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- Net Salary = Gross Salary - Total Deductions -->
                  <Assign DisplayName="Compute Net Salary">
                    <Assign.To><OutArgument x:TypeArguments="x:Double">[netSalary]</OutArgument></Assign.To>
                    <Assign.Value><InArgument x:TypeArguments="x:Double">[Math.Round(grossSalary - totalDeductions, 2)]</InArgument></Assign.Value>
                  </Assign>

                  <!-- Accumulate and Output -->
                  <Assign><Assign.To><OutArgument x:TypeArguments="x:Double">[var_GrossAccumulator]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Double">[var_GrossAccumulator + grossSalary]</InArgument></Assign.Value></Assign>
                  <Assign><Assign.To><OutArgument x:TypeArguments="x:Double">[var_NetAccumulator]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Double">[var_NetAccumulator + netSalary]</InArgument></Assign.Value></Assign>
                  <Assign><Assign.To><OutArgument x:TypeArguments="x:Int32">[var_ValidCount]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Int32">[var_ValidCount + 1]</InArgument></Assign.Value></Assign>

                  <ui:AddDataRow ArrayRow="[{ empId, basicPayable, hraAmount, daAmount, otherAllowancesPayable, grossSalary, pfDeduction, taxDeduction, totalDeductions, netSalary, &quot;Processed&quot; }]" 
                    DataTable="[dt_SalaryRegister]" DisplayName="Append to dt_SalaryRegister" />
                </Sequence>
              </If.Else>
            </If>
          </Sequence>
        </ActivityAction>
      </ui:ForEachRow.Body>
    </ui:ForEachRow>

    <!-- Step 5: Write Output to Excel Workbook -->
    <ui:ExcelApplicationScope Password="{x:Null}" DisplayName="Scope: Output Payroll_Report.xlsx" WorkbookPath="[var_OutputPath]">
      <ui:ExcelApplicationScope.Body>
        <ActivityAction x:TypeArguments="ui:WorkbookApplication">
          <ActivityAction.Argument>
            <DelegateInArgument x:TypeArguments="ui:WorkbookApplication" Name="ExcelOutScope" />
          </ActivityAction.Argument>
          <Sequence DisplayName="Write Output Sheets">
            <ui:ExcelWriteRange AddHeaders="True" DataTable="[dt_SalaryRegister]" DisplayName="Write Salary_Register" SheetName="Salary_Register" StartingCell="A1" />
            <If Condition="[dt_ErrorReport.Rows.Count &gt; 0]" DisplayName="Write Error Log If Present">
              <If.Then>
                <ui:ExcelWriteRange AddHeaders="True" DataTable="[dt_ErrorReport]" DisplayName="Write Error_Log" SheetName="Error_Log" StartingCell="A1" />
              </If.Then>
            </If>
          </Sequence>
        </ActivityAction>
      </ui:ExcelApplicationScope.Body>
    </ui:ExcelApplicationScope>

    <!-- Step 6: Map Output Arguments -->
    <Assign DisplayName="Set out_OutputReportPath"><Assign.To><OutArgument x:TypeArguments="x:String">[out_OutputReportPath]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:String">[var_OutputPath]</InArgument></Assign.Value></Assign>
    <Assign DisplayName="Set out_TotalGrossPayroll"><Assign.To><OutArgument x:TypeArguments="x:Double">[out_TotalGrossPayroll]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Double">[var_GrossAccumulator]</InArgument></Assign.Value></Assign>
    <Assign DisplayName="Set out_TotalNetPayroll"><Assign.To><OutArgument x:TypeArguments="x:Double">[out_TotalNetPayroll]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Double">[var_NetAccumulator]</InArgument></Assign.Value></Assign>
    <Assign DisplayName="Set out_ValidRecordsCount"><Assign.To><OutArgument x:TypeArguments="x:Int32">[out_ValidRecordsCount]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Int32">[var_ValidCount]</InArgument></Assign.Value></Assign>
    <Assign DisplayName="Set out_InvalidRecordsCount"><Assign.To><OutArgument x:TypeArguments="x:Int32">[out_InvalidRecordsCount]</OutArgument></Assign.To><Assign.Value><InArgument x:TypeArguments="x:Int32">[var_InvalidCount]</InArgument></Assign.Value></Assign>

    <ui:LogMessage DisplayName="Log Completion" Level="Info" 
      Message="[&quot;[PayFlow RPA] Process Finished. Valid: &quot; + var_ValidCount.ToString + &quot;, Gross: &quot; + var_GrossAccumulator.ToString]" />
  </Sequence>
</Activity>`;

export const UIPATH_DEMO_GUIDE = {
  projectTitle: "Automated Excel-Based Payroll Preparation Using UiPath and Excel",
  systemRole: "Enterprise HR Automation & RPA Processing Pipeline",
  enterpriseAutomationFramework: [
    {
      phase: "1. Automated Ingestion & Data Validation",
      summary: "Manual payroll preparation in organizations takes hours of error-prone copy-pasting between biometric/attendance spreadsheets and salary formulas. Inaccurate proration, statutory deduction slip-ups, or unverified formula edits cause severe compliance and employee satisfaction issues.",
      talkingPoints: [
        "Biometric logs contain partial attendance, leave discrepancies, and formatting anomalies.",
        "Manual calculation of HRA, DA, PF, and Tax across hundreds of rows introduces human errors.",
        "UiPath RPA delivers 100% deterministic, audited, and repeatable execution directly into Excel workbooks."
      ]
    },
    {
      phase: "2. System Architecture",
      summary: "Three-tier enterprise architecture: Web UI (React + Tailwind CSS) → Backend Execution Controller (Express.js / Node.js) → UiPath RPA Engine (Excel Activities & XAML Sequences) → Multi-sheet Output Workbook (Payroll_Report.xlsx).",
      talkingPoints: [
        "Web application provides user authentication, drag-and-drop file ingestion, and live visual validation.",
        "Backend controller handles data staging, validation checks against Employee Master records, and RPA job dispatch.",
        "UiPath process executes the exact mathematical formulas, flags discrepancies into dt_ErrorReport, and compiles multi-sheet workbooks."
      ]
    },
    {
      phase: "3. Automated Processing Sequence",
      summary: "Standard 4-step enterprise payroll execution pipeline:",
      talkingPoints: [
        "Step 1: Open Employee Management to manage employee profiles across Engineering, HR, Finance, and Operations with configurable salary structures.",
        "Step 2: Navigate to Payroll Processing. Select month, set standard working days. Download the template or load attendance data.",
        "Step 3: Automated validation audit! Catch missing IDs, zero-day anomalies, or days worked exceeding total working days before calculation.",
        "Step 4: Trigger the UiPath RPA Execution. Observe the live sequence of Excel activities executing in real-time, generate the final Payroll_Report.xlsx, and download the multi-sheet register."
      ]
    },
    {
      phase: "4. UiPath Execution Methods",
      summary: "PayFlow supports both Direct Backend Execution and Real UiPath Studio / CLI Execution:",
      talkingPoints: [
        "Option A (Zero-Setup Instant Execution): PayFlow backend executes the exact UiPath activity pipeline internally and produces authentic Excel workbooks.",
        "Option B (UiPath Assistant / Studio): Download Main.xaml and project.json from the RPA Center, open in UiPath Studio 2024.10, and click 'Run'.",
        "Option C (CLI Trigger): Execute from Windows terminal: UiRobot.exe execute --file PayFlow_Payroll_Automation\\Main.xaml"
      ]
    }
  ]
};
