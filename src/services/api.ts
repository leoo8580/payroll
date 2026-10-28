import { Employee, PayrollRun, SystemSettings, UiPathExecutionDetails } from '../types/payroll';
import { INITIAL_EMPLOYEES, INITIAL_PAYROLL_RUNS, INITIAL_SETTINGS } from '../data/initialData';

const BASE_URL = '';

export const api = {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/employees`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      return await res.json();
    } catch (err) {
      console.warn('API fetch failed, falling back to local storage', err);
      const local = localStorage.getItem('payflow_employees');
      return local ? JSON.parse(local) : INITIAL_EMPLOYEES;
    }
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    try {
      const res = await fetch(`${BASE_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }
      return await res.json();
    } catch (err: any) {
      throw err;
    }
  },

  async bulkImportEmployees(list: Partial<Employee>[]): Promise<Employee[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/employees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to bulk import employees');
      }
      const data = await res.json();
      return data.employees;
    } catch (err: any) {
      throw err;
    }
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }
      return await res.json();
    } catch (err: any) {
      throw err;
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete employee');
      }
    } catch (err: any) {
      throw err;
    }
  },

  // Payroll Runs
  async getPayrollRuns(): Promise<PayrollRun[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/payroll/runs`);
      if (!res.ok) throw new Error('Failed to fetch payroll runs');
      return await res.json();
    } catch (err) {
      console.warn('API fetch failed for payroll runs', err);
      const local = localStorage.getItem('payflow_runs');
      return local ? JSON.parse(local) : INITIAL_PAYROLL_RUNS;
    }
  },

  async savePayrollRun(run: PayrollRun): Promise<PayrollRun> {
    try {
      const res = await fetch(`${BASE_URL}/api/payroll/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(run),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save payroll run');
      }
      return await res.json();
    } catch (err: any) {
      throw err;
    }
  },

  async deletePayrollRun(id: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/api/payroll/runs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete payroll run');
      }
    } catch (err: any) {
      throw err;
    }
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch(`${BASE_URL}/api/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (err) {
      return INITIAL_SETTINGS;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const res = await fetch(`${BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      return data.settings;
    } catch (err: any) {
      throw err;
    }
  },

  // RPA Trigger
  async triggerUiPathRPA(payload: {
    periodKey: string;
    month: string;
    year: number;
    recordsCount: number;
    workingDays: number;
  }): Promise<UiPathExecutionDetails> {
    try {
      const res = await fetch(`${BASE_URL}/api/rpa/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('UiPath RPA execution failed');
      const data = await res.json();
      return data.details;
    } catch (err: any) {
      throw err;
    }
  },

  // Reset clean state
  async resetDemoData(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/api/reset-demo`, { method: 'POST' });
    } catch (err) {
      console.warn('Reset demo error', err);
    }
  },

  // Clear all employees & runs
  async clearAllData(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/api/clear-all`, { method: 'POST' });
    } catch (err) {
      console.warn('Clear all error', err);
    }
  },

  // Optional: load sample dataset
  async loadSampleData(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/api/load-sample`, { method: 'POST' });
    } catch (err) {
      console.warn('Load sample error', err);
    }
  },
};
