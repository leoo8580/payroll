import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  Check, 
  X, 
  AlertCircle,
  Building,
  CreditCard,
  Mail,
  UserCheck,
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Employee, EmploymentStatus, SystemSettings } from '../../types/payroll';
import { formatCurrency, round2 } from '../../services/payrollCalculator';
import { 
  generateEmployeeMasterTemplate, 
  parseEmployeeRosterWorkbook, 
  downloadFile 
} from '../../services/excelService';

interface EmployeeManagementProps {
  employees: Employee[];
  settings: SystemSettings;
  onAddEmployee: (emp: Partial<Employee>) => Promise<void>;
  onBulkImportEmployees: (list: Partial<Employee>[]) => Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  settings,
  onAddEmployee,
  onBulkImportEmployees,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof Employee>('employeeId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal / Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Bulk import state
  const [bulkParsedEmployees, setBulkParsedEmployees] = useState<Partial<Employee>[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    department: 'Engineering',
    designation: '',
    basicSalary: 60000,
    hraPercentage: settings.defaultHraPercentage || 20,
    daPercentage: settings.defaultDaPercentage || 10,
    otherAllowances: 5000,
    pfPercentage: settings.defaultPfPercentage || 12,
    taxPercentage: settings.defaultTaxPercentage || 10,
    employmentStatus: 'Active' as EmploymentStatus,
    bankName: 'HDFC Bank Ltd',
    bankAccount: '',
    ifscCode: 'HDFC0000451',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live auto-calculation for form preview
  const liveBasic = Number(formData.basicSalary) || 0;
  const liveHra = round2((liveBasic * (Number(formData.hraPercentage) || 0)) / 100);
  const liveDa = round2((liveBasic * (Number(formData.daPercentage) || 0)) / 100);
  const liveAllowances = Number(formData.otherAllowances) || 0;
  const liveGross = round2(liveBasic + liveHra + liveDa + liveAllowances);
  const livePf = round2((liveBasic * (Number(formData.pfPercentage) || 0)) / 100);
  const liveTax = round2((liveGross * (Number(formData.taxPercentage) || 0)) / 100);
  const liveTotalDeductions = round2(livePf + liveTax);
  const liveNet = round2(liveGross - liveTotalDeductions);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return ['All', ...Array.from(set)];
  }, [employees]);

  // Filtered & Sorted employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesQuery =
          emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept =
          selectedDepartment === 'All' || emp.department === selectedDepartment;

        const matchesStatus =
          selectedStatus === 'All' || emp.employmentStatus === selectedStatus;

        return matchesQuery && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
  }, [employees, searchQuery, selectedDepartment, selectedStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openAddModal = () => {
    const maxNum = employees.reduce((max, e) => {
      const match = e.employeeId.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 1000);
    const nextId = `EMP-${maxNum + 1}`;

    setFormData({
      employeeId: nextId,
      fullName: '',
      email: '',
      department: 'Engineering',
      designation: '',
      basicSalary: 60000,
      hraPercentage: settings.defaultHraPercentage || 20,
      daPercentage: settings.defaultDaPercentage || 10,
      otherAllowances: 5000,
      pfPercentage: settings.defaultPfPercentage || 12,
      taxPercentage: settings.defaultTaxPercentage || 10,
      employmentStatus: 'Active',
      bankName: 'HDFC Bank Ltd',
      bankAccount: '',
      ifscCode: 'HDFC0000451',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      basicSalary: emp.basicSalary,
      hraPercentage: emp.hraPercentage,
      daPercentage: emp.daPercentage,
      otherAllowances: emp.otherAllowances,
      pfPercentage: emp.pfPercentage,
      taxPercentage: emp.taxPercentage,
      employmentStatus: emp.employmentStatus,
      bankName: emp.bankName || 'HDFC Bank Ltd',
      bankAccount: emp.bankAccount || '',
      ifscCode: emp.ifscCode || 'HDFC0000451',
    });
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formData.employeeId.trim()) {
      setFormError('Employee ID is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid corporate email is required.');
      return;
    }
    if (!formData.designation.trim()) {
      setFormError('Designation is required.');
      return;
    }
    if (formData.basicSalary <= 0) {
      setFormError('Basic monthly salary must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await onUpdateEmployee(editingEmployee.id, formData);
        setEditingEmployee(null);
      } else {
        await onAddEmployee({
          ...formData,
          joinedDate: new Date().toISOString().split('T')[0],
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    setIsSubmitting(true);
    try {
      await onDeleteEmployee(deletingEmployee.id);
      setDeletingEmployee(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk import handlers
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseEmployeeRosterWorkbook(buffer);
        setBulkParsedEmployees(parsed);
        setBulkFileName(file.name);
      } catch (err: any) {
        alert(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImportConfirm = async () => {
    if (bulkParsedEmployees.length === 0) return;
    setIsBulkUploading(true);
    try {
      await onBulkImportEmployees(bulkParsedEmployees);
      setIsBulkModalOpen(false);
      setBulkParsedEmployees([]);
      setBulkFileName(null);
    } catch (err: any) {
      alert(`Bulk import failed: ${err.message}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadMasterTemplate = () => {
    const bytes = generateEmployeeMasterTemplate();
    downloadFile(bytes, 'Employee_Master_Roster_Template.xlsx');
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top Filter and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee ID, Name, or Designation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Dropdowns and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Dept:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Filter by department"
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by employment status"
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Download Template Action */}
          <button
            onClick={handleDownloadMasterTemplate}
            title="Download Excel Roster Template"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template</span>
          </button>

          {/* Bulk Import from Excel */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>Auto-Import Excel</span>
          </button>

          {/* Add Employee CTA */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* When 0 employees exist: Clean, inviting empty state */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your Employee Directory is Fresh & Ready</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            No dummy data is present. Start building your organization by adding your first employee or auto-importing an existing Excel staff roster.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Add Your First Employee</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span>Auto-Import from Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadMasterTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>
      ) : (
        /* Employees Table Container */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-700">
              Showing <span className="font-mono">{filteredEmployees.length}</span> of{' '}
              <span className="font-mono">{employees.length}</span> Master Records
            </div>
            <span className="text-[11px] text-slate-400">Click headers to sort</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th
                    onClick={() => handleSort('employeeId')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('fullName')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('department')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Department</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Designation</th>
                  <th
                    onClick={() => handleSort('basicSalary')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Basic Monthly</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Allowances / Tax</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <p className="font-medium text-slate-700">No employees match your search criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the department or status filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {emp.employeeId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-500">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {emp.department}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp.designation}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(emp.basicSalary, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center text-[11px] text-slate-600 font-mono">
                        <span>HRA:{emp.hraPercentage}% · DA:{emp.daPercentage}% · PF:{emp.pfPercentage}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.employmentStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.employmentStatus === 'On Leave'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingEmployee(emp)}
                            title="View Profile Details"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit Employee"
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            title="Delete Employee"
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
      )}

      {/* Auto-Import Bulk Excel Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Auto-Import Employee Roster from Excel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an Excel (.xlsx, .xls) file containing employee names, IDs, departments, and basic salaries.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkParsedEmployees([]);
                  setBulkFileName(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onClick={() => bulkFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/10 group"
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 mt-3">
                  Click to browse or drop your Employee Excel roster
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports columns: Employee ID, Full Name, Email, Department, Designation, Basic Monthly Salary, Allowances
                </p>
              </div>

              {/* Template Download Link */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span>Need the official column headers structure?</span>
                <button
                  type="button"
                  onClick={handleDownloadMasterTemplate}
                  className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blank Excel Template</span>
                </button>
              </div>

              {/* Parsed Employees Preview */}
              {bulkParsedEmployees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Parsed Roster ({bulkParsedEmployees.length} employees found)</span>
                    <span className="text-emerald-700 font-normal">File: {bulkFileName}</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 text-[10px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Emp ID</th>
                          <th className="py-2 px-3">Full Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Designation</th>
                          <th className="py-2 px-3 text-right">Basic Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {bulkParsedEmployees.map((e, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-900">{e.employeeId}</td>
                            <td className="py-1.5 px-3 font-sans text-slate-800">{e.fullName}</td>
                            <td className="py-1.5 px-3 font-sans text-slate-600">{e.department}</td>
                            <td className="py-1.5 px-3 font-sans text-slate-600">{e.designation}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(Number(e.basicSalary) || 0, settings.currencySymbol)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkParsedEmployees([]);
                    setBulkFileName(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportConfirm}
                  disabled={bulkParsedEmployees.length === 0 || isBulkUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    {isBulkUploading
                      ? 'Importing...'
                      : `Import ${bulkParsedEmployees.length} Employees`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || editingEmployee) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingEmployee ? `Edit Employee ${editingEmployee.employeeId}` : 'Add New Employee'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set master personal information, compensation structure, and statutory rates
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEmployee(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* General Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    placeholder="EMP-1001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Ramesh Chandra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    placeholder="ramesh.chandra@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Engineering, Sales, HR, Finance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Systems Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Salary Structure */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Compensation & Calculation Percentages
                  </h4>
                  <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Calculates Live</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Basic Monthly Salary ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      HRA Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.hraPercentage}
                      onChange={(e) => setFormData({ ...formData, hraPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      DA Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.daPercentage}
                      onChange={(e) => setFormData({ ...formData, daPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Other Allowances ({settings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formData.otherAllowances}
                      onChange={(e) => setFormData({ ...formData, otherAllowances: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PF Deduction (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.pfPercentage}
                      onChange={(e) => setFormData({ ...formData, pfPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax TDS (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.taxPercentage}
                      onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Automated Live Computation Preview */}
                <div className="mt-3 p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-700">
                    Gross: <span className="font-bold text-slate-900">{formatCurrency(liveGross, settings.currencySymbol)}</span>
                  </div>
                  <div className="text-rose-700">
                    Deductions: <span className="font-bold">{formatCurrency(liveTotalDeductions, settings.currencySymbol)}</span>
                  </div>
                  <div className="text-teal-900 font-bold bg-white px-2.5 py-1 rounded border border-teal-200">
                    Net: {formatCurrency(liveNet, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
                  Disbursement Bank Account
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Profile Drawer */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-md shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {viewingEmployee.employeeId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewingEmployee.fullName}</h3>
                <p className="text-xs text-slate-500">{viewingEmployee.designation}</p>
              </div>
              <button
                onClick={() => setViewingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Profile Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Corporate Email</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date Joined</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.joinedDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-emerald-700">{viewingEmployee.employmentStatus}</span>
                </div>
              </div>

              {/* Monthly Salary Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-900 mb-3">Salary Component Structure</h4>
                <div className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between text-slate-700">
                    <span>Basic Monthly</span>
                    <span className="font-bold">{formatCurrency(viewingEmployee.basicSalary, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>HRA ({viewingEmployee.hraPercentage}%)</span>
                    <span>{formatCurrency((viewingEmployee.basicSalary * viewingEmployee.hraPercentage) / 100, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>DA ({viewingEmployee.daPercentage}%)</span>
                    <span>{formatCurrency((viewingEmployee.basicSalary * viewingEmployee.daPercentage) / 100, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Other Allowances</span>
                    <span>{formatCurrency(viewingEmployee.otherAllowances || 0, settings.currencySymbol)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Estimated Monthly Gross</span>
                    <span>
                      {formatCurrency(
                        viewingEmployee.basicSalary * (1 + (viewingEmployee.hraPercentage + viewingEmployee.daPercentage) / 100) +
                          (viewingEmployee.otherAllowances || 0),
                        settings.currencySymbol
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Deductions */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Statutory Rates</h4>
                <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>Provident Fund (PF):</span>
                    <span className="font-semibold text-slate-900">{viewingEmployee.pfPercentage}% of Basic</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Deducted at Source (TDS):</span>
                    <span className="font-semibold text-slate-900">{viewingEmployee.taxPercentage}% of Gross</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Disbursement Bank Account</h4>
                <p className="text-xs text-slate-700 font-semibold">{viewingEmployee.bankName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">A/C: {viewingEmployee.bankAccount || 'Not Provided'}</p>
                <p className="text-xs text-slate-500 font-mono">IFSC: {viewingEmployee.ifscCode || 'Not Provided'}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setViewingEmployee(null);
                    openEditModal(viewingEmployee);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors w-full"
                >
                  Edit Master Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Are you sure you want to delete employee <span className="font-semibold text-slate-900">{deletingEmployee.fullName}</span> ({deletingEmployee.employeeId})? This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
