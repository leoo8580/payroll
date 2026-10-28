import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Wallet, 
  Percent, 
  RotateCcw, 
  Check, 
  ShieldAlert, 
  Cpu, 
  Save, 
  FileText 
} from 'lucide-react';
import { SystemSettings } from '../../types/payroll';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onClearAll?: () => Promise<void>;
  onLoadSample?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemo,
  onClearAll,
  onLoadSample,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset database to clean initial state? All custom employees and runs will be reset to default demo data.')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetDemo();
      alert('Database reset to clean demo state.');
      window.location.reload();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Organization & Employer Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / GST Registration Number</label>
              <input
                type="text"
                required
                value={formData.taxRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Corporate Address</label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Wallet className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Currency & Valuation Defaults</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const curr = e.target.value;
                  const symbol = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';
                  setFormData({ ...formData, currency: curr, currencySymbol: symbol });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              >
                <option value="INR">Indian Rupee (INR · ₹)</option>
                <option value="USD">US Dollar (USD · $)</option>
                <option value="EUR">Euro (EUR · €)</option>
                <option value="GBP">British Pound (GBP · £)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Working Days / Month</label>
              <input
                type="number"
                min={15}
                max={31}
                value={formData.defaultWorkingDays}
                onChange={(e) => setFormData({ ...formData, defaultWorkingDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Calculation Formula Percentages */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Percent className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Default Salary Calculation Percentages</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HRA Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.defaultHraPercentage}
                onChange={(e) => setFormData({ ...formData, defaultHraPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">% of Basic Payable</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">DA Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.defaultDaPercentage}
                onChange={(e) => setFormData({ ...formData, defaultDaPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">% of Basic Payable</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PF Rate (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={formData.defaultPfPercentage}
                onChange={(e) => setFormData({ ...formData, defaultPfPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Statutory Employee PF</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax TDS Rate (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={formData.defaultTaxPercentage}
                onChange={(e) => setFormData({ ...formData, defaultTaxPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">% of Gross Salary</span>
            </div>
          </div>
        </div>

        {/* Statutory Compliance & Formula Reference */}
        <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Statutory Compliance & Automated Formula Reference</span>
          </div>
          <p className="leading-relaxed">
            Formulas configured in PayFlow automate monthly payroll proration: Basic Salary Payable = (Basic Salary × Days Worked) / Working Days, HRA (20%), DA (10%), Gross Salary summation, PF (12%), and Tax TDS (10%). Update percentages above to reflect your organization's compensation policy and jurisdiction.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Wipe all data and start completely fresh? All employees and payroll runs will be cleared.')) {
                  if (onClearAll) await onClearAll();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Data (Start 100% Fresh)</span>
            </button>

            {onLoadSample && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Load the 16 reference sample employees for quick demonstration?')) {
                    await onLoadSample();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <span>Load Sample Dataset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Configuration Saved</span>
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
