import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { updatePayrollConfig } from './actions';

async function getConfig() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/payroll/config`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function PayrollConfigPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const config = await getConfig();
  const hasError = resolvedSearchParams.error === 'true';
  const saved = resolvedSearchParams.saved === 'true';

  if (!config) return <div className="p-8 text-center text-rose-500 font-bold">Failed to load payroll config.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Settings</h1>
        <p className="text-sm text-gray-500 mt-1">GRSIA rates, working hours, overtime multipliers, and the EOS gratuity formula input.</p>
      </div>

      {hasError && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-sm text-red-700 font-medium">Failed to save settings.</p></div>}
      {saved && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md"><p className="text-sm text-emerald-700 font-medium">Settings saved.</p></div>}

      <form action={updatePayrollConfig} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">GRSIA (Qatari nationals only)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Employee Contribution %</label>
              <input type="number" step="0.01" name="grsiaEmployeePercent" defaultValue={config.grsiaEmployeePercent} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Employer Contribution %</label>
              <input type="number" step="0.01" name="grsiaEmployerPercent" defaultValue={config.grsiaEmployerPercent} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Working Hours & Overtime</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Working Days / Month</label>
              <input type="number" step="0.5" name="workingDaysPerMonth" defaultValue={config.workingDaysPerMonth} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Working Hours / Day</label>
              <input type="number" step="0.5" name="workingHoursPerDay" defaultValue={config.workingHoursPerDay} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Overtime Multiplier</label>
              <input type="number" step="0.01" name="overtimeMultiplier" defaultValue={config.overtimeMultiplier} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Night/Holiday Overtime Multiplier</label>
              <input type="number" step="0.01" name="nightOvertimeMultiplier" defaultValue={config.nightOvertimeMultiplier} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">End of Service Gratuity</h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Weeks of Basic Pay per Year of Service</label>
            <input type="number" step="0.1" name="eosWeeksPerYear" defaultValue={config.eosWeeksPerYear} className="w-full max-w-xs border border-gray-300 rounded-md px-4 py-3 text-black" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save Settings</button>
        </div>
      </form>
    </div>
  );
}
