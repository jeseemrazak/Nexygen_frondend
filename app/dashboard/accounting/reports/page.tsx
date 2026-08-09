import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getReports(from?: string, to?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const headers = { 'Authorization': `Bearer ${token}` };

  const plQuery = new URLSearchParams();
  if (from) plQuery.set('from', from);
  if (to) plQuery.set('to', to);

  const bsQuery = new URLSearchParams();
  if (to) bsQuery.set('asOf', to);

  try {
    const [plRes, bsRes, cfRes] = await Promise.all([
      fetch(`${API_BASE_URL}/accounting/reports/profit-loss?${plQuery.toString()}`, { headers, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/accounting/reports/balance-sheet?${bsQuery.toString()}`, { headers, cache: 'no-store' }),
      from && to
        ? fetch(`${API_BASE_URL}/accounting/reports/cash-flow?from=${from}&to=${to}`, { headers, cache: 'no-store' })
        : Promise.resolve(null),
    ]);
    return {
      pl: plRes.ok ? await plRes.json() : null,
      bs: bsRes.ok ? await bsRes.json() : null,
      cf: cfRes && cfRes.ok ? await cfRes.json() : null,
    };
  } catch (error) {
    return { pl: null, bs: null, cf: null };
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const resolvedParams = await searchParams;
  const { pl, bs, cf } = await getReports(resolvedParams.from, resolvedParams.to);
  const rangeQuery = new URLSearchParams();
  if (resolvedParams.from) rangeQuery.set('from', resolvedParams.from);
  if (resolvedParams.to) rangeQuery.set('to', resolvedParams.to);
  const asOfQuery = resolvedParams.to ? `?asOf=${resolvedParams.to}` : '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Statements</h1>
          <p className="text-sm text-gray-500 mt-1">Profit &amp; Loss, Balance Sheet, and Cash Flow Statement. Set a From/To range to also generate Cash Flow.</p>
        </div>
        <form action="/dashboard/accounting/reports" className="flex items-center gap-3">
          <input type="date" name="from" defaultValue={resolvedParams.from || ''} placeholder="From" className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          <input type="date" name="to" defaultValue={resolvedParams.to || ''} placeholder="To" className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md text-sm">Filter</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PROFIT & LOSS */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Profit &amp; Loss</h2>
            <Link href={`/dashboard/accounting/reports/profit-loss/print?${rangeQuery.toString()}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-md text-xs">🖨️ Print</Link>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Income</p>
              {pl?.incomeLines?.length ? pl.incomeLines.map((l: any) => (
                <div key={l.account.id} className="flex justify-between text-sm text-black py-1">
                  <span>{l.account.name}</span>
                  <span className="font-bold">{formatQAR(l.amount)}</span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">No income recorded.</p>}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Expenses</p>
              {pl?.expenseLines?.length ? pl.expenseLines.map((l: any) => (
                <div key={l.account.id} className="flex justify-between text-sm text-black py-1">
                  <span>{l.account.name}</span>
                  <span className="font-bold">{formatQAR(l.amount)}</span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">No expenses recorded.</p>}
            </div>
            <div className="border-t-2 border-gray-300 pt-4 flex justify-between">
              <span className="font-black text-gray-800">Net Profit</span>
              <span className={`font-black ${pl && pl.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatQAR(pl?.netProfit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* BALANCE SHEET */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Balance Sheet</h2>
            <Link href={`/dashboard/accounting/reports/balance-sheet/print${asOfQuery}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-md text-xs">🖨️ Print</Link>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Assets</p>
              {bs?.assetLines?.length ? bs.assetLines.map((l: any) => (
                <div key={l.account.id} className="flex justify-between text-sm text-black py-1">
                  <span>{l.account.name}</span>
                  <span className="font-bold">{formatQAR(l.amount)}</span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">No assets recorded.</p>}
              <div className="flex justify-between text-sm font-bold border-t border-gray-100 mt-2 pt-2">
                <span>Total Assets</span><span>{formatQAR(bs?.totalAssets || 0)}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Liabilities</p>
              {bs?.liabilityLines?.length ? bs.liabilityLines.map((l: any) => (
                <div key={l.account.id} className="flex justify-between text-sm text-black py-1">
                  <span>{l.account.name}</span>
                  <span className="font-bold">{formatQAR(l.amount)}</span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">No liabilities recorded.</p>}
              <div className="flex justify-between text-sm font-bold border-t border-gray-100 mt-2 pt-2">
                <span>Total Liabilities</span><span>{formatQAR(bs?.totalLiabilities || 0)}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Equity</p>
              {bs?.equityLines?.map((l: any) => (
                <div key={l.account.code} className="flex justify-between text-sm text-black py-1">
                  <span>{l.account.name}</span>
                  <span className="font-bold">{formatQAR(l.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t border-gray-100 mt-2 pt-2">
                <span>Total Equity</span><span>{formatQAR(bs?.totalEquity || 0)}</span>
              </div>
            </div>
            <div className="border-t-2 border-gray-300 pt-4 flex justify-between">
              <span className="font-black text-gray-800">Assets = Liabilities + Equity</span>
              <span className={`font-black ${bs && Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatQAR(bs?.totalAssets || 0)} = {formatQAR((bs?.totalLiabilities || 0) + (bs?.totalEquity || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* CASH FLOW STATEMENT */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Cash Flow Statement</h2>
            {resolvedParams.from && resolvedParams.to && (
              <Link href={`/dashboard/accounting/reports/cash-flow/print?${rangeQuery.toString()}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-md text-xs">🖨️ Print</Link>
            )}
          </div>
          <div className="p-6">
            {!resolvedParams.from || !resolvedParams.to ? (
              <p className="text-sm text-gray-400 italic">Set a From and To date above to generate the Cash Flow Statement for that period.</p>
            ) : !cf ? (
              <p className="text-sm text-gray-400 italic">No data for this range.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Operating</p>
                  <div className="flex justify-between text-sm text-black py-1"><span>Net Income</span><span className="font-bold">{formatQAR(cf.netProfit)}</span></div>
                  <div className="flex justify-between text-sm text-black py-1"><span>Working capital changes</span><span className="font-bold">{formatQAR(cf.netCashFromOperating - cf.netProfit)}</span></div>
                  <div className="flex justify-between text-sm font-black border-t border-gray-100 mt-2 pt-2"><span>Net Operating</span><span>{formatQAR(cf.netCashFromOperating)}</span></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Investing</p>
                  <div className="flex justify-between text-sm font-black py-1"><span>Net Investing</span><span>{formatQAR(cf.netCashFromInvesting)}</span></div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 mt-4">Financing</p>
                  <div className="flex justify-between text-sm font-black py-1"><span>Net Financing</span><span>{formatQAR(cf.netCashFromFinancing)}</span></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cash Reconciliation</p>
                  <div className="flex justify-between text-sm text-black py-1"><span>Opening Cash &amp; Bank</span><span>{formatQAR(cf.openingCash)}</span></div>
                  <div className="flex justify-between text-sm text-black py-1"><span>Closing Cash &amp; Bank</span><span>{formatQAR(cf.closingCash)}</span></div>
                  <div className="flex justify-between text-sm font-black border-t border-gray-100 mt-2 pt-2"><span>Net Change in Cash</span><span>{formatQAR(cf.netChangeInCash)}</span></div>
                  <p className={`text-xs font-bold mt-2 ${cf.reconciles ? 'text-emerald-600' : 'text-rose-600'}`}>{cf.reconciles ? '✓ Reconciles' : '✗ Does not reconcile'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
