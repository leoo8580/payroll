import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, Db } from 'mongodb';
import { Employee, PayrollRun, SystemSettings } from '../types/payroll';
import { INITIAL_EMPLOYEES, INITIAL_PAYROLL_RUNS, INITIAL_SETTINGS, SAMPLE_EMPLOYEES, SAMPLE_PAYROLL_RUNS } from '../data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if MONGODB_URI is provided
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'payflow';

// Global cache for MongoDB client in serverless environments
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

if (MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    clientPromise = client.connect();
  }
}

async function getMongoDb(): Promise<Db | null> {
  if (!clientPromise) return null;
  try {
    const client = await clientPromise;
    return client.db(DB_NAME);
  } catch (err) {
    console.error('Failed to connect to MongoDB, falling back to local storage:', err);
    return null;
  }
}

// Local File / Memory Fallback Storage
interface DatabaseSchema {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  settings: SystemSettings;
}

function resolveStoragePath(): string {
  // Try writing to workspace data/ folder
  const standardDir = path.join(__dirname, '..', '..', 'data');
  try {
    if (!fs.existsSync(standardDir)) {
      fs.mkdirSync(standardDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(standardDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return path.join(standardDir, 'store.json');
  } catch {
    // Read-only filesystem (e.g. Vercel Serverless without MongoDB)
    const tmpDir = '/tmp';
    return path.join(tmpDir, 'payflow_store.json');
  }
}

const STORAGE_PATH = resolveStoragePath();

// In-memory buffer in case file operations fail
let memoryStore: DatabaseSchema = {
  employees: INITIAL_EMPLOYEES,
  payrollRuns: INITIAL_PAYROLL_RUNS,
  settings: INITIAL_SETTINGS,
};

function readLocalStore(): DatabaseSchema {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
      memoryStore = JSON.parse(content);
      return memoryStore;
    }
  } catch (err) {
    console.warn('Could not read from storage file, using in-memory store:', err);
  }
  return memoryStore;
}

function writeLocalStore(data: DatabaseSchema) {
  memoryStore = data;
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to storage file (serverless read-only), keeping in-memory:', err);
  }
}

// Exported Database Service
export const dbService = {
  async isMongoConnected(): Promise<boolean> {
    if (!MONGODB_URI) return false;
    try {
      const db = await getMongoDb();
      if (!db) return false;
      await db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  },

  async getHealth() {
    const isMongo = Boolean(MONGODB_URI);
    let connected = false;
    if (isMongo) {
      connected = await this.isMongoConnected();
    }
    return {
      status: 'ok',
      service: 'PayFlow Payroll System',
      storage: isMongo && connected ? 'mongodb' : isMongo ? 'mongodb_fallback' : 'local_store',
      mongoConfigured: isMongo,
      mongoConnected: connected,
    };
  },

  // 1. Settings
  async getSettings(): Promise<SystemSettings> {
    const db = await getMongoDb();
    if (db) {
      try {
        const doc = await db.collection('settings').findOne({ _id: 'global_settings' as any });
        if (doc) {
          const { _id, ...settings } = doc;
          return settings as SystemSettings;
        }
        // Initialize default settings in Mongo
        await db.collection('settings').insertOne({ _id: 'global_settings' as any, ...INITIAL_SETTINGS });
        return INITIAL_SETTINGS;
      } catch (err) {
        console.error('Mongo getSettings error, falling back to local:', err);
      }
    }
    return readLocalStore().settings;
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('settings').updateOne(
          { _id: 'global_settings' as any },
          { $set: updates },
          { upsert: true }
        );
        return await this.getSettings();
      } catch (err) {
        console.error('Mongo updateSettings error, falling back to local:', err);
      }
    }
    const current = readLocalStore();
    current.settings = { ...current.settings, ...updates };
    writeLocalStore(current);
    return current.settings;
  },

  // 2. Employees
  async getEmployees(): Promise<Employee[]> {
    const db = await getMongoDb();
    if (db) {
      try {
        const docs = await db.collection('employees').find({}).toArray();
        return docs.map(doc => {
          const { _id, ...emp } = doc;
          return emp as unknown as Employee;
        });
      } catch (err) {
        console.error('Mongo getEmployees error, falling back to local:', err);
      }
    }
    return readLocalStore().employees;
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const employeeId = (employee.employeeId || '').toUpperCase().trim();
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }

    const newEmp: Employee = {
      id: employee.id || `emp-${Date.now()}`,
      employeeId,
      fullName: employee.fullName || 'Employee Name',
      email: employee.email || `${employeeId.toLowerCase()}@company.com`,
      department: employee.department || 'General',
      designation: employee.designation || 'Staff',
      basicSalary: Number(employee.basicSalary) || 50000,
      hraPercentage: Number(employee.hraPercentage) ?? 20,
      daPercentage: Number(employee.daPercentage) ?? 10,
      otherAllowances: Number(employee.otherAllowances) || 0,
      pfPercentage: Number(employee.pfPercentage) ?? 12,
      taxPercentage: Number(employee.taxPercentage) ?? 10,
      employmentStatus: employee.employmentStatus || 'Active',
      joinedDate: employee.joinedDate || new Date().toISOString().split('T')[0],
      bankAccount: employee.bankAccount || '',
      bankName: employee.bankName || 'Primary Bank',
      ifscCode: employee.ifscCode || '',
    };

    const db = await getMongoDb();
    if (db) {
      try {
        const existing = await db.collection('employees').findOne({
          employeeId: { $regex: new RegExp(`^${employeeId}$`, 'i') }
        });
        if (existing) {
          throw new Error(`Employee ID ${employeeId} already exists.`);
        }
        await db.collection('employees').insertOne({ ...newEmp });
        return newEmp;
      } catch (err) {
        if ((err as Error).message.includes('already exists')) throw err;
        console.error('Mongo createEmployee error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    const exists = current.employees.some(
      e => e.employeeId.toLowerCase() === employeeId.toLowerCase()
    );
    if (exists) {
      throw new Error(`Employee ID ${employeeId} already exists.`);
    }

    current.employees.unshift(newEmp);
    writeLocalStore(current);
    return newEmp;
  },

  async bulkUpsertEmployees(list: Partial<Employee>[]): Promise<{ added: number; updated: number; employees: Employee[] }> {
    if (!Array.isArray(list)) {
      throw new Error('Expected an array of employee objects');
    }

    const db = await getMongoDb();
    if (db) {
      try {
        let added = 0;
        let updated = 0;

        for (let idx = 0; idx < list.length; idx++) {
          const item = list[idx];
          const rawId = (item.employeeId || `EMP-${Date.now() + idx}`).toUpperCase().trim();
          
          const existing = await db.collection('employees').findOne({
            employeeId: { $regex: new RegExp(`^${rawId}$`, 'i') }
          });

          const completeEmp: Employee = {
            id: existing ? (existing as any).id : `emp-${Date.now()}-${idx}`,
            employeeId: rawId,
            fullName: item.fullName || 'Employee Name',
            email: item.email || `${rawId.toLowerCase()}@company.com`,
            department: item.department || 'General',
            designation: item.designation || 'Staff',
            basicSalary: Number(item.basicSalary) || 50000,
            hraPercentage: Number(item.hraPercentage) ?? 20,
            daPercentage: Number(item.daPercentage) ?? 10,
            otherAllowances: Number(item.otherAllowances) || 0,
            pfPercentage: Number(item.pfPercentage) ?? 12,
            taxPercentage: Number(item.taxPercentage) ?? 10,
            employmentStatus: item.employmentStatus || 'Active',
            joinedDate: item.joinedDate || new Date().toISOString().split('T')[0],
            bankAccount: item.bankAccount || '',
            bankName: item.bankName || 'Primary Bank',
            ifscCode: item.ifscCode || '',
          };

          if (existing) {
            await db.collection('employees').updateOne(
              { _id: existing._id },
              { $set: completeEmp }
            );
            updated++;
          } else {
            await db.collection('employees').insertOne({ ...completeEmp });
            added++;
          }
        }

        const allEmps = await this.getEmployees();
        return { added, updated, employees: allEmps };
      } catch (err) {
        console.error('Mongo bulkUpsertEmployees error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    let addedCount = 0;
    let updatedCount = 0;

    list.forEach((item, idx) => {
      const rawId = (item.employeeId || `EMP-${Date.now() + idx}`).toUpperCase().trim();
      const existingIdx = current.employees.findIndex(
        e => e.employeeId.toLowerCase() === rawId.toLowerCase()
      );

      const completeEmp: Employee = {
        id: existingIdx >= 0 ? current.employees[existingIdx].id : `emp-${Date.now()}-${idx}`,
        employeeId: rawId,
        fullName: item.fullName || 'Employee Name',
        email: item.email || `${rawId.toLowerCase()}@company.com`,
        department: item.department || 'General',
        designation: item.designation || 'Staff',
        basicSalary: Number(item.basicSalary) || 50000,
        hraPercentage: Number(item.hraPercentage) ?? 20,
        daPercentage: Number(item.daPercentage) ?? 10,
        otherAllowances: Number(item.otherAllowances) || 0,
        pfPercentage: Number(item.pfPercentage) ?? 12,
        taxPercentage: Number(item.taxPercentage) ?? 10,
        employmentStatus: item.employmentStatus || 'Active',
        joinedDate: item.joinedDate || new Date().toISOString().split('T')[0],
        bankAccount: item.bankAccount || '',
        bankName: item.bankName || 'Primary Bank',
        ifscCode: item.ifscCode || '',
      };

      if (existingIdx >= 0) {
        current.employees[existingIdx] = completeEmp;
        updatedCount++;
      } else {
        current.employees.push(completeEmp);
        addedCount++;
      }
    });

    writeLocalStore(current);
    return { added: addedCount, updated: updatedCount, employees: current.employees };
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const db = await getMongoDb();
    if (db) {
      try {
        const existing = await db.collection('employees').findOne({
          $or: [{ id }, { employeeId: id }, { employeeId: id.toUpperCase() }]
        });
        if (!existing) {
          throw new Error('Employee not found');
        }

        const targetId = (updates.employeeId || '').toUpperCase().trim();
        if (targetId && targetId !== (existing as any).employeeId) {
          const duplicate = await db.collection('employees').findOne({
            employeeId: { $regex: new RegExp(`^${targetId}$`, 'i') },
            id: { $ne: (existing as any).id }
          });
          if (duplicate) {
            throw new Error(`Employee ID ${targetId} is already in use.`);
          }
        }

        const merged: Employee = {
          ...(existing as unknown as Employee),
          ...updates,
          id: (existing as any).id,
          employeeId: targetId || (existing as any).employeeId,
        };

        await db.collection('employees').updateOne(
          { _id: existing._id },
          { $set: merged }
        );

        return merged;
      } catch (err) {
        if ((err as Error).message.includes('not found') || (err as Error).message.includes('already in use')) {
          throw err;
        }
        console.error('Mongo updateEmployee error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    const index = current.employees.findIndex(e => e.id === id || e.employeeId === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }

    const targetId = (updates.employeeId || '').toUpperCase().trim();
    if (targetId && targetId !== current.employees[index].employeeId) {
      const exists = current.employees.some(
        e => e.id !== id && e.employeeId.toLowerCase() === targetId.toLowerCase()
      );
      if (exists) {
        throw new Error(`Employee ID ${targetId} is already in use by another employee.`);
      }
    }

    current.employees[index] = {
      ...current.employees[index],
      ...updates,
      id: current.employees[index].id,
      employeeId: targetId || current.employees[index].employeeId,
    };

    writeLocalStore(current);
    return current.employees[index];
  },

  async deleteEmployee(id: string): Promise<void> {
    const db = await getMongoDb();
    if (db) {
      try {
        const res = await db.collection('employees').deleteOne({
          $or: [{ id }, { employeeId: id }, { employeeId: id.toUpperCase() }]
        });
        if (res.deletedCount === 0) {
          throw new Error('Employee not found');
        }
        return;
      } catch (err) {
        if ((err as Error).message.includes('not found')) throw err;
        console.error('Mongo deleteEmployee error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    const beforeLen = current.employees.length;
    current.employees = current.employees.filter(e => e.id !== id && e.employeeId !== id);
    if (current.employees.length === beforeLen) {
      throw new Error('Employee not found');
    }
    writeLocalStore(current);
  },

  // 3. Payroll Runs
  async getPayrollRuns(): Promise<PayrollRun[]> {
    const db = await getMongoDb();
    if (db) {
      try {
        const docs = await db.collection('payroll_runs').find({}).sort({ processedAt: -1 }).toArray();
        return docs.map(doc => {
          const { _id, ...run } = doc;
          return run as unknown as PayrollRun;
        });
      } catch (err) {
        console.error('Mongo getPayrollRuns error, falling back to local:', err);
      }
    }
    return readLocalStore().payrollRuns;
  },

  async savePayrollRun(run: PayrollRun): Promise<PayrollRun> {
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('payroll_runs').updateOne(
          { $or: [{ periodKey: run.periodKey }, { id: run.id }] },
          { $set: run },
          { upsert: true }
        );
        return run;
      } catch (err) {
        console.error('Mongo savePayrollRun error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    const existingIndex = current.payrollRuns.findIndex(
      r => r.periodKey === run.periodKey || r.id === run.id
    );

    if (existingIndex >= 0) {
      current.payrollRuns[existingIndex] = run;
    } else {
      current.payrollRuns.unshift(run);
    }

    writeLocalStore(current);
    return run;
  },

  async deletePayrollRun(id: string): Promise<void> {
    const db = await getMongoDb();
    if (db) {
      try {
        const res = await db.collection('payroll_runs').deleteOne({ id });
        if (res.deletedCount === 0) {
          throw new Error('Payroll run not found');
        }
        return;
      } catch (err) {
        if ((err as Error).message.includes('not found')) throw err;
        console.error('Mongo deletePayrollRun error, falling back to local:', err);
      }
    }

    const current = readLocalStore();
    const initialCount = current.payrollRuns.length;
    current.payrollRuns = current.payrollRuns.filter(r => r.id !== id);
    if (current.payrollRuns.length === initialCount) {
      throw new Error('Payroll run not found');
    }
    writeLocalStore(current);
  },

  // 4. Utility operations
  async clearAll(): Promise<void> {
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('employees').deleteMany({});
        await db.collection('payroll_runs').deleteMany({});
      } catch (err) {
        console.error('Mongo clearAll error:', err);
      }
    }
    const current = readLocalStore();
    current.employees = [];
    current.payrollRuns = [];
    writeLocalStore(current);
  },

  async loadSample(): Promise<void> {
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('employees').deleteMany({});
        await db.collection('payroll_runs').deleteMany({});
        if (SAMPLE_EMPLOYEES.length > 0) {
          await db.collection('employees').insertMany([...SAMPLE_EMPLOYEES]);
        }
        if (SAMPLE_PAYROLL_RUNS.length > 0) {
          await db.collection('payroll_runs').insertMany([...SAMPLE_PAYROLL_RUNS]);
        }
      } catch (err) {
        console.error('Mongo loadSample error:', err);
      }
    }
    const current = readLocalStore();
    current.employees = [...SAMPLE_EMPLOYEES];
    current.payrollRuns = [...SAMPLE_PAYROLL_RUNS];
    writeLocalStore(current);
  },

  async resetDemo(): Promise<void> {
    await this.clearAll();
    const current = readLocalStore();
    current.settings = INITIAL_SETTINGS;
    writeLocalStore(current);
  },
};
