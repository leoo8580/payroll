import { Employee, PayrollRun, SystemSettings, UiPathExecutionDetails } from '../types/payroll';
import { INITIAL_SETTINGS } from '../data/initialData';

const BASE_URL = '';

/**
 * Robust HTTP response handler that guarantees meaningful error messages
 * instead of cryptic "Unexpected token <, <!doctype... is not valid JSON" errors.
 */
async function handleResponse<T>(res: Response, defaultError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorDetail = defaultError;

    if (contentType.includes('application/json')) {
      try {
        const json = await res.json();
        errorDetail = json.error || json.message || defaultError;
      } catch {
        errorDetail = `HTTP ${res.status}: ${res.statusText || defaultError}`;
      }
    } else {
      try {
        const text = await res.text();
        const trimmed = text.trim();
        if (trimmed.startsWith('<') || trimmed.startsWith('<!doctype') || trimmed.toLowerCase().includes('<html')) {
          errorDetail = `HTTP ${res.status} (${res.statusText || 'Not Found'}): The server returned an HTML error page instead of JSON. Ensure the backend API routes are active.`;
        } else if (trimmed.length > 0 && trimmed.length < 200) {
          errorDetail = trimmed;
        } else {
          errorDetail = `HTTP ${res.status}: ${res.statusText || defaultError}`;
        }
      } catch {
        errorDetail = `HTTP ${res.status}: ${res.statusText || defaultError}`;
      }
    }

    throw new Error(errorDetail);
  }

  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      throw new Error('Malformed JSON received from server.');
    }
  }

  // Fallback in case Content-Type is missing but body is valid JSON
  try {
    const raw = await res.text();
    return JSON.parse(raw);
  } catch {
    throw new Error(`Expected JSON response from server, but received non-JSON payload (${res.status}).`);
  }
}

export const api = {
  // Server Health & Diagnostics
  async getHealth(): Promise<{ status: string; storage: string; mongoConfigured: boolean; mongoConnected: boolean }> {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      return await handleResponse(res, 'Health check failed');
    } catch (err: any) {
      throw new Error(`Cannot connect to PayFlow backend: ${err.message}`);
    }
  },

  // Employees CRUD
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch(`${BASE_URL}/api/employees`);
    return await handleResponse<Employee[]>(res, 'Failed to fetch employees from server');
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
    return await handleResponse<Employee>(res, 'Failed to create employee');
  },

  async bulkImportEmployees(list: Partial<Employee>[]): Promise<Employee[]> {
    const res = await fetch(`${BASE_URL}/api/employees/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    const data = await handleResponse<{ success: boolean; employees: Employee[] }>(res, 'Failed to bulk import employees');
    return data.employees;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/api/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await handleResponse<Employee>(res, 'Failed to update employee');
  },

  async deleteEmployee(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await handleResponse<{ success: boolean }>(res, 'Failed to delete employee');
  },

  // Payroll Runs CRUD
  async getPayrollRuns(): Promise<PayrollRun[]> {
    const res = await fetch(`${BASE_URL}/api/payroll/runs`);
    return await handleResponse<PayrollRun[]>(res, 'Failed to fetch payroll runs from server');
  },

  async savePayrollRun(run: PayrollRun): Promise<PayrollRun> {
    const res = await fetch(`${BASE_URL}/api/payroll/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(run),
    });
    return await handleResponse<PayrollRun>(res, 'Failed to save payroll run');
  },

  async deletePayrollRun(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/payroll/runs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await handleResponse<{ success: boolean }>(res, 'Failed to delete payroll run');
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch(`${BASE_URL}/api/settings`);
      return await handleResponse<SystemSettings>(res, 'Failed to fetch settings');
    } catch (err) {
      console.warn('Could not load settings from server, using default:', err);
      return INITIAL_SETTINGS;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await handleResponse<{ success: boolean; settings: SystemSettings }>(res, 'Failed to update settings');
    return data.settings;
  },

  // RPA Trigger
  async triggerUiPathRPA(payload: {
    periodKey: string;
    month: string;
    year: number;
    recordsCount: number;
    workingDays: number;
  }): Promise<UiPathExecutionDetails> {
    const res = await fetch(`${BASE_URL}/api/rpa/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ success: boolean; details: UiPathExecutionDetails }>(res, 'UiPath RPA execution failed');
    return data.details;
  },

  // Reset clean state
  async resetDemoData(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/reset-demo`, { method: 'POST' });
    await handleResponse<{ success: boolean }>(res, 'Reset demo failed');
  },

  // Clear all employees & runs
  async clearAllData(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/clear-all`, { method: 'POST' });
    await handleResponse<{ success: boolean }>(res, 'Clear all data failed');
  },

  // Load sample dataset
  async loadSampleData(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/load-sample`, { method: 'POST' });
    await handleResponse<{ success: boolean }>(res, 'Load sample data failed');
  },
};
