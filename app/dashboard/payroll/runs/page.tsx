import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { generateRun } from './actions';

async function getRuns() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/payroll/runs`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-QA', { month: 'short', day: 'numeric', year: 'numeric' });

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PROCESSED: 'bg-blue-50 text-blue-700',
  PAID: 'bg-purple-50 text-purple-700',
};

export default async function PayrollRunsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const runs = await getRuns();
  const hasError = resolvedSearchParams.error === 'true';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Runs</h1>
        <p className="text-sm text-gray-500 mt-1">Generate a run for a period, review/edit payslips, then process and pay.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Generate New Run</h2>
        {hasError && <p className="text-rose-600 text-sm font-semibold mb-3">Failed to generate run — check there's at least one payroll-active employee.</p>}
        <form action={generateRun} className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Period Start</label>
            <input type="date" name="periodStart" required className="border border-gray-300 rounded-md p-3 text-black" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Period End</label>
            <input type="date" name="periodEnd" required className="border border-gray-300 rounded-md p-3 text-black" />
          </div>
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-md shadow-sm">
            Generate Run
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {runs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No payroll runs yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Run #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Gross</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Net</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {runs.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-purple-700">{r.runNo || `#${r.id}`}</td>
                  <td className="py-4 px-6 text-sm">{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</td>
                  <td className="py-4 px-6 text-right text-sm">{formatQAR(r.totalGross)}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(r.totalNet)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${statusBadge[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/dashboard/payroll/runs/${r.id}`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold transition">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
