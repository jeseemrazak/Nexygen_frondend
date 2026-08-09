import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getTrialBalance(asOf?: string, warehouseId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const query = new URLSearchParams();
  if (asOf) query.set('asOf', asOf);
  if (warehouseId) query.set('warehouseId', warehouseId);

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/trial-balance?${query.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { rows: [], grandTotalDebit: 0, grandTotalCredit: 0 };
    return await res.json();
  } catch (error) {
    return { rows: [], grandTotalDebit: 0, grandTotalCredit: 0 };
  }
}

async function getWarehouses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/warehouses`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<{ asOf?: string; warehouseId?: string }> }) {
  const resolvedParams = await searchParams;
  const [data, warehouses] = await Promise.all([
    getTrialBalance(resolvedParams.asOf, resolvedParams.warehouseId),
    getWarehouses(),
  ]);
  const isBalanced = Math.abs(data.grandTotalDebit - data.grandTotalCredit) < 0.001;
  const printQuery = new URLSearchParams();
  if (resolvedParams.asOf) printQuery.set('asOf', resolvedParams.asOf);
  if (resolvedParams.warehouseId) printQuery.set('warehouseId', resolvedParams.warehouseId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trial Balance</h1>
          <p className="text-sm text-gray-500 mt-1">Total debits and credits should always match.</p>
        </div>
        <div className="flex items-center gap-3">
          <form action="/dashboard/accounting/trial-balance" className="flex items-center gap-3">
            <input type="date" name="asOf" defaultValue={resolvedParams.asOf || ''} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
            {warehouses.length > 0 && (
              <select name="warehouseId" defaultValue={resolvedParams.warehouseId || ''} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
                <option value="">All Outlets</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md text-sm">Filter</button>
          </form>
          <Link
            href={`/dashboard/accounting/trial-balance/print?${printQuery.toString()}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap"
          >
            🖨️ Print
          </Link>
        </div>
      </div>

      <div className={`p-4 rounded-lg border font-bold text-center ${isBalanced ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
        {isBalanced ? '✓ Books are balanced' : '✗ Books are NOT balanced — this should never happen'}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {data.rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Account</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Debit</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {data.rows.map((row: any) => (
                <tr key={row.account.id}>
                  <td className="py-3 px-6 font-bold">{row.account.code} - {row.account.name}</td>
                  <td className="py-3 px-6 text-right text-sm">{row.totalDebit > 0 ? formatQAR(row.totalDebit) : ''}</td>
                  <td className="py-3 px-6 text-right text-sm">{row.totalCredit > 0 ? formatQAR(row.totalCredit) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="py-3 px-6 font-black">TOTAL</td>
                <td className="py-3 px-6 text-right font-black">{formatQAR(data.grandTotalDebit)}</td>
                <td className="py-3 px-6 text-right font-black">{formatQAR(data.grandTotalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
