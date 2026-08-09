import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getOutletPnl(from?: string, to?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/outlet-pnl?${query.toString()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export default async function OutletPnlPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const resolvedParams = await searchParams;
  const data = await getOutletPnl(resolvedParams.from, resolvedParams.to);
  const rangeQuery = new URLSearchParams();
  if (resolvedParams.from) rangeQuery.set('from', resolvedParams.from);
  if (resolvedParams.to) rangeQuery.set('to', resolvedParams.to);

  const columns: { id: number | null; name: string }[] = data?.warehouses || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Outlet P&amp;L</h1>
          <p className="text-sm text-gray-500 mt-1">Profit &amp; Loss broken out per warehouse/outlet. Only POS sales, Sales Invoices, and Delivery COGS carry an outlet tag — everything else (purchases, payroll, manual entries, expenses) falls under "Unassigned".</p>
        </div>
        <div className="flex items-center gap-3">
          <form action="/dashboard/accounting/reports/outlet-pnl" className="flex items-center gap-3">
            <input type="date" name="from" defaultValue={resolvedParams.from || ''} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
            <input type="date" name="to" defaultValue={resolvedParams.to || ''} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md text-sm">Filter</button>
          </form>
          <Link href={`/dashboard/accounting/reports/outlet-pnl/print?${rangeQuery.toString()}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap">🖨️ Print</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {!data ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : columns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No warehouses configured yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Account</th>
                {columns.map((c) => (
                  <th key={c.id ?? 'unassigned'} className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">{c.name}</th>
                ))}
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              <tr className="bg-gray-50">
                <td colSpan={columns.length + 2} className="py-2 px-6 text-xs font-bold text-gray-500 uppercase">Income</td>
              </tr>
              {data.incomeRows.length === 0 && (
                <tr><td colSpan={columns.length + 2} className="py-4 px-6 text-sm text-gray-400 italic">No income recorded.</td></tr>
              )}
              {data.incomeRows.map((row: any) => (
                <tr key={row.account.id}>
                  <td className="py-3 px-6 text-sm">{row.account.name}</td>
                  {columns.map((c) => (
                    <td key={c.id ?? 'unassigned'} className="py-3 px-6 text-sm text-right">{formatQAR(c.id === null ? row.unassigned : row.byWarehouseId[c.id] || 0)}</td>
                  ))}
                  <td className="py-3 px-6 text-sm text-right font-bold">{formatQAR(row.total)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={columns.length + 2} className="py-2 px-6 text-xs font-bold text-gray-500 uppercase">Expenses</td>
              </tr>
              {data.expenseRows.length === 0 && (
                <tr><td colSpan={columns.length + 2} className="py-4 px-6 text-sm text-gray-400 italic">No expenses recorded.</td></tr>
              )}
              {data.expenseRows.map((row: any) => (
                <tr key={row.account.id}>
                  <td className="py-3 px-6 text-sm">{row.account.name}</td>
                  {columns.map((c) => (
                    <td key={c.id ?? 'unassigned'} className="py-3 px-6 text-sm text-right">{formatQAR(c.id === null ? row.unassigned : row.byWarehouseId[c.id] || 0)}</td>
                  ))}
                  <td className="py-3 px-6 text-sm text-right font-bold">{formatQAR(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td className="py-3 px-6 font-black">Net Profit</td>
                {data.netByColumn.map((c: any) => (
                  <td key={c.id ?? 'unassigned'} className={`py-3 px-6 text-right font-black ${c.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatQAR(c.net)}</td>
                ))}
                <td className={`py-3 px-6 text-right font-black ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatQAR(data.netProfit)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
