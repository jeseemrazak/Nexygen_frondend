import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

async function getValuation() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/inventory/valuation`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { warehouses: [], grandTotal: 0 };
    return await res.json();
  } catch (error) {
    return { warehouses: [], grandTotal: 0 };
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default async function StockValuationPage() {
  const data = await getValuation();
  const warehouses = data.warehouses || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Value by Warehouse</h1>
          <p className="text-sm text-gray-500 mt-1">Quantity × cost price, per warehouse. Rows marked "est." fall back to the sale price because no cost price has been set yet.</p>
        </div>
        <div className="bg-slate-900 rounded-lg px-6 py-3 text-center">
          <p className="text-xs font-bold text-slate-300 uppercase">Grand Total</p>
          <p className="text-2xl font-bold text-white mt-1">{formatQAR(data.grandTotal || 0)}</p>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No stock on hand.
        </div>
      ) : (
        warehouses.map((wh: any) => (
          <div key={wh.warehouseId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">🏭 {wh.warehouseName}</h2>
              <span className="text-sm font-bold text-teal-700">{formatQAR(wh.total)}</span>
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
