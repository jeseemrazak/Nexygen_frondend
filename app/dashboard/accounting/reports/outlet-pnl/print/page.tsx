import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import PrintButton from '@/components/print/PrintButton';

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

export default async function OutletPnlPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const resolvedParams = await searchParams;
  const [data, settings] = await Promise.all([getOutletPnl(resolvedParams.from, resolvedParams.to), getCompanySettings()]);
  const accent = settings?.reportAccentColor || '0D9488';
  const columns: { id: number | null; name: string }[] = data?.warehouses || [];

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-6xl mx-auto">
        <Link href="/dashboard/accounting/reports/outlet-pnl" className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Outlet P&amp;L</Link>
        <PrintButton />
      </div>
      <div className="print-area print-landscape bg-white p-10 max-w-6xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Outlet P&L" subtitle={resolvedParams.from && resolvedParams.to ? `${resolvedParams.from} to ${resolvedParams.to}` : undefined} accentColor={accent} />
        {!data || columns.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No data for this report.</p>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: `#E0E0E0` }}>
                <th className="border border-gray-300 p-2 font-bold">Account</th>
                {columns.map((c) => (
                  <th key={c.id ?? 'unassigned'} className="border border-gray-300 p-2 font-bold text-right">{c.name}</th>
                ))}
                <th className="border border-gray-300 p-2 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={columns.length + 2} className="p-2 font-bold uppercase text-gray-600">Income</td></tr>
              {data.incomeRows.map((row: any) => (
                <tr key={row.account.id}>
                  <td className="border border-gray-200 p-2">{row.account.name}</td>
                  {columns.map((c) => (
                    <td key={c.id ?? 'unassigned'} className="border border-gray-200 p-2 text-right">{formatQAR(c.id === null ? row.unassigned : row.byWarehouseId[c.id] || 0)}</td>
                  ))}
                  <td className="border border-gray-200 p-2 text-right font-bold">{formatQAR(row.total)}</td>
                </tr>
              ))}
              <tr><td colSpan={columns.length + 2} className="p-2 font-bold uppercase text-gray-600">Expenses</td></tr>
              {data.expenseRows.map((row: any) => (
                <tr key={row.account.id}>
                  <td className="border border-gray-200 p-2">{row.account.name}</td>
                  {columns.map((c) => (
                    <td key={c.id ?? 'unassigned'} className="border border-gray-200 p-2 text-right">{formatQAR(c.id === null ? row.unassigned : row.byWarehouseId[c.id] || 0)}</td>
                  ))}
                  <td className="border border-gray-200 p-2 text-right font-bold">{formatQAR(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800 font-black">
                <td className="p-2">Net Profit</td>
                {data.netByColumn.map((c: any) => (
                  <td key={c.id ?? 'unassigned'} className="p-2 text-right">{formatQAR(c.net)}</td>
                ))}
                <td className="p-2 text-right" style={{ color: `#${accent}` }}>{formatQAR(data.netProfit)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
