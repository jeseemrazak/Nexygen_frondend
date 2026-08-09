import { cookies } from 'next/headers';
import Link from 'next/link';
import Form from 'next/form';
import { API_BASE_URL } from '@/lib/config';

async function getValuation() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const [valuationRes, warehousesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/inventory/valuation`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/warehouses`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    const valuation = valuationRes.ok ? await valuationRes.json() : { warehouses: [], grandTotal: 0 };
    const allWarehouses = warehousesRes.ok ? await warehousesRes.json() : [];
    return { ...valuation, allWarehouses };
  } catch (error) {
    return { warehouses: [], grandTotal: 0, allWarehouses: [] };
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default async function StockValuationPage({
  searchParams
}: {
  searchParams: Promise<{ warehouseId?: string }>
}) {
  const resolvedParams = await searchParams;
  const warehouseFilter = resolvedParams.warehouseId || 'all';

  const data = await getValuation();
  const allWarehouses = data.allWarehouses || [];
  const warehouses = warehouseFilter === 'all'
    ? (data.warehouses || [])
    : (data.warehouses || []).filter((wh: any) => String(wh.warehouseId) === warehouseFilter);

  const displayTotal = warehouseFilter === 'all'
    ? (data.grandTotal || 0)
    : warehouses.reduce((sum: number, wh: any) => sum + wh.total, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Value by Warehouse</h1>
          <p className="text-sm text-gray-500 mt-1">Quantity × cost price, per warehouse. Rows marked "est." fall back to the sale price because no cost price has been set yet.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Form action="/dashboard/inventory/valuation" className="flex items-center gap-2">
            <select name="warehouseId" defaultValue={warehouseFilter} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
              <option value="all">All Warehouses</option>
              {allWarehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md text-sm">
              Filter
            </button>
            {warehouseFilter !== 'all' && (
              <Link href="/dashboard/inventory/valuation" className="text-gray-500 underline text-sm whitespace-nowrap">Clear</Link>
            )}
          </Form>
          <div className="bg-slate-900 rounded-lg px-6 py-3 text-center">
            <p className="text-xs font-bold text-slate-300 uppercase">{warehouseFilter === 'all' ? 'Grand Total' : 'Total'}</p>
            <p className="text-2xl font-bold text-white mt-1">{formatQAR(displayTotal)}</p>
          </div>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No stock on hand{warehouseFilter !== 'all' ? ' in this warehouse' : ''}.
        </div>
      ) : (
        warehouses.map((wh: any) => (
          <div key={wh.warehouseId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">🏭 {wh.warehouseName}</h2>
              <span className="text-sm font-bold text-purple-700">{formatQAR(wh.total)}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Qty</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Unit Cost</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-black">
                {wh.rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 font-bold text-gray-800">{row.productName}</td>
                    <td className="py-3 px-6 text-sm font-mono text-gray-600">{row.batchNumber}</td>
                    <td className="py-3 px-6 text-right text-sm text-gray-700">{row.quantity}</td>
                    <td className="py-3 px-6 text-right text-sm text-gray-700">
                      {formatQAR(row.unitValue)}
                      {row.isEstimated && <span className="ml-1 text-[10px] text-amber-600 font-bold">est.</span>}
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
