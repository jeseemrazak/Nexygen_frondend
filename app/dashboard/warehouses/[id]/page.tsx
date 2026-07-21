import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getWarehouse(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

const formatDateOnly = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const warehouse = await getWarehouse(resolvedParams.id);

  if (!warehouse) return <div className="p-8 text-center text-rose-500 font-bold">Warehouse not found.</div>;

  const inventories = (warehouse.inventories || []).slice().sort((a: any, b: any) => a.product.name.localeCompare(b.product.name));
  const totalUnits = inventories.reduce((sum: number, inv: any) => sum + inv.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/warehouses" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to Warehouses
        </Link>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{warehouse.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{warehouse.location || 'No location specified'}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Batches</p>
              <p className="text-xl font-bold text-gray-800">{inventories.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Total Units</p>
              <p className="text-xl font-bold text-teal-700">{totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {inventories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No stock in this warehouse yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Quantity</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Cost Price</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Stock Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {inventories.map((inv: any) => {
                const costPrice = inv.product.costPrice || 0;
                const isEstimated = costPrice === 0 && inv.product.price > 0;
                const unitValue = isEstimated ? inv.product.price : costPrice;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-800">{inv.product.name}</td>
                    <td className="py-4 px-6 text-sm font-mono text-gray-600">{inv.batchNumber}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {inv.expiryDate ? formatDateOnly(inv.expiryDate) : <span className="italic text-gray-400">N/A</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        inv.quantity === 0 ? 'bg-red-100 text-red-700' :
                        inv.quantity < 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {inv.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm text-gray-600">
                      {new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(unitValue)}
                      {isEstimated && <span className="ml-1 text-[10px] text-amber-600 font-bold" title="No cost price set — estimated from sale price">est.</span>}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-sm">
                      {new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(unitValue * inv.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
