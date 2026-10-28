import express, { Request, Response, NextFunction } from 'express';
import { dbService } from './db';
import { Employee, PayrollRun, UiPathExecutionDetails } from '../types/payroll';

export function createExpressApp() {
  const app = express();

  // 1. CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // 2. Body Parser
  app.use(express.json({ limit: '20mb' }));

  // Custom JSON parse error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Malformed JSON payload' });
    }
    next(err);
  });

  // 3. API Router definition
  const apiRouter = express.Router();

  // Health
  apiRouter.get('/health', async (req: Request, res: Response) => {
    try {
      const health = await dbService.getHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Settings
  apiRouter.get('/settings', async (req: Request, res: Response) => {
    try {
      const settings = await dbService.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch settings' });
    }
  });

  apiRouter.put('/settings', async (req: Request, res: Response) => {
    try {
      const updated = await dbService.updateSettings(req.body);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // Employees CRUD
  apiRouter.get('/employees', async (req: Request, res: Response) => {
    try {
      const employees = await dbService.getEmployees();
      res.json(employees);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve employees' });
    }
  });

  apiRouter.post('/employees', async (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Request body is required' });
      }
      if (!req.body.employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }
      if (!req.body.fullName) {
        return res.status(400).json({ error: 'Full Name is required' });
      }
      const created = await dbService.createEmployee(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      const isClientError = err.message.includes('already exists') || err.message.includes('required');
      res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to create employee' });
    }
  });

  // Bulk add / import employees
  apiRouter.post('/employees/bulk', async (req: Request, res: Response) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Expected an array of employee records' });
      }
      const result = await dbService.bulkUpsertEmployees(req.body);
      res.json({
        success: true,
        message: `Successfully processed ${req.body.length} employees (${result.added} added, ${result.updated} updated).`,
        employees: result.employees,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to bulk import employees' });
    }
  });

  // Support both PUT and PATCH for updates
  const handleUpdateEmployee = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await dbService.updateEmployee(id, req.body);
      res.json(updated);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      if (err.message.includes('already in use')) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || 'Failed to update employee' });
    }
  };

  apiRouter.put('/employees/:id', handleUpdateEmployee);
  apiRouter.patch('/employees/:id', handleUpdateEmployee);

  apiRouter.delete('/employees/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dbService.deleteEmployee(id);
      res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.status(500).json({ error: err.message || 'Failed to delete employee' });
    }
  });

  // Payroll Runs CRUD
  apiRouter.get('/payroll/runs', async (req: Request, res: Response) => {
    try {
      const runs = await dbService.getPayrollRuns();
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch payroll runs' });
    }
  });

  apiRouter.post('/payroll/runs', async (req: Request, res: Response) => {
    try {
      const newRun: PayrollRun = req.body;
      if (!newRun || !newRun.periodKey) {
        return res.status(400).json({ error: 'Valid payroll run object with periodKey is required' });
      }
      const saved = await dbService.savePayrollRun(newRun);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save payroll run' });
    }
  });

  apiRouter.delete('/payroll/runs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dbService.deletePayrollRun(id);
      res.json({ success: true, message: 'Payroll run deleted successfully' });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: 'Payroll run not found' });
      }
      res.status(500).json({ error: err.message || 'Failed to delete payroll run' });
    }
  });

  // RPA Automation Execution Simulation
  apiRouter.post('/rpa/execute', (req: Request, res: Response) => {
    try {
      const { periodKey, month, year, recordsCount, workingDays } = req.body;
      const executionStart = Date.now();
      const jobId = `JOB-${periodKey || '2026-10'}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();

      const activities = [
        {
          activityId: 'ACT_01',
          activityName: 'ExcelApplicationScope (Init)',
          type: 'UiPath.Excel.Activities.ExcelApplicationScope',
          timestamp: `${now.toTimeString().split(' ')[0]}.105`,
          durationMs: 280,
          status: 'Success' as const,
          details: 'Excel instance initialized and bound to COM session.',
        },
        {
          activityId: 'ACT_02',
          activityName: 'ReadRange (Attendance_Input.xlsx)',
          type: 'UiPath.Excel.Activities.ReadRange',
          timestamp: `${now.toTimeString().split(' ')[0]}.390`,
          durationMs: 310,
          status: 'Success' as const,
          details: `Loaded ${recordsCount || 15} attendance rows from primary input sheet.`,
        },
        {
          activityId: 'ACT_03',
          activityName: 'DataColumnValidation & Lookup',
          type: 'UiPath.Core.Activities.LookupDataTable',
          timestamp: `${now.toTimeString().split(' ')[0]}.710`,
          durationMs: 240,
          status: 'Success' as const,
          details: 'Cross-validated Employee Master IDs and attendance integrity.',
        },
        {
          activityId: 'ACT_04',
          activityName: 'InvokeCode (Salary Math Engine)',
          type: 'UiPath.Core.Activities.InvokeCode',
          timestamp: `${now.toTimeString().split(' ')[0]}.960`,
          durationMs: 460,
          status: 'Success' as const,
          details: `Computed Prorated Basic, HRA (20%), DA (10%), Allowances, PF (12%), Tax (10%) for ${workingDays || 26} working days.`,
        },
        {
          activityId: 'ACT_05',
          activityName: 'WriteRange (Salary_Register)',
          type: 'UiPath.Excel.Activities.WriteRange',
          timestamp: `${new Date(now.getTime() + 1000).toTimeString().split(' ')[0]}.430`,
          durationMs: 320,
          status: 'Success' as const,
          details: 'Compiled consolidated salary register table into output workbook.',
        },
        {
          activityId: 'ACT_06',
          activityName: 'ExcelWriteCell (Summary Dashboard)',
          type: 'UiPath.Excel.Activities.WriteCell',
          timestamp: `${new Date(now.getTime() + 1000).toTimeString().split(' ')[0]}.760`,
          durationMs: 190,
          status: 'Success' as const,
          details: 'Generated executive summary sheet with totals and verification checksums.',
        },
        {
          activityId: 'ACT_07',
          activityName: 'CloseApplication & Release',
          type: 'UiPath.Excel.Activities.CloseApplication',
          timestamp: `${new Date(now.getTime() + 2000).toTimeString().split(' ')[0]}.020`,
          durationMs: 140,
          status: 'Success' as const,
          details: `Output saved to Payroll_Report_${periodKey || '2026-10'}.xlsx. Process completed cleanly.`,
        },
      ];

      const executionDetails: UiPathExecutionDetails = {
        jobId,
        robotName: 'UiPath-Worker-Node01',
        hostName: 'BLR-RPA-PROD-SRV',
        workflowVersion: '1.2.0',
        startedAt: now.toISOString(),
        completedAt: new Date().toISOString(),
        durationSeconds: Math.round(((Date.now() - executionStart) / 1000 + 1.8) * 100) / 100,
        recordsProcessed: recordsCount || 15,
        validRecordsCount: recordsCount || 15,
        invalidRecordsCount: 0,
        outputWorkbookName: `Payroll_Report_${periodKey || '2026-10'}.xlsx`,
        outputFileSizeBytes: 44250,
        activitiesLog: activities,
      };

      res.json({
        success: true,
        message: 'UiPath RPA Excel automation workflow completed successfully',
        details: executionDetails,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'RPA execution failed' });
    }
  });

  // Data management
  apiRouter.post('/clear-all', async (req: Request, res: Response) => {
    try {
      await dbService.clearAll();
      res.json({ success: true, message: 'All employees and runs cleared. Fresh canvas active.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to clear data' });
    }
  });

  apiRouter.post('/load-sample', async (req: Request, res: Response) => {
    try {
      await dbService.loadSample();
      res.json({ success: true, message: 'Sample dataset loaded.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load sample dataset' });
    }
  });

  apiRouter.post('/reset-demo', async (req: Request, res: Response) => {
    try {
      await dbService.resetDemo();
      res.json({ success: true, message: 'Database reset to clean state' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset database' });
    }
  });

  // Mount apiRouter on BOTH '/api' and '/'
  // This guarantees that both direct requests (/api/employees) and rewritten requests (/employees) match seamlessly!
  app.use('/api', apiRouter);
  app.use(apiRouter);

  // Catch-all for unhandled /api/* routes so they NEVER fall through to HTML SPA
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
  });

  return { app, apiRouter };
}
