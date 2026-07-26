import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import AdjustStockForm from './AdjustStockForm';

export default async function AdjustInventoryPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const targetId = parseInt(resolvedParams.id, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });

  const warehouses = await res.json();

  let targetInv = null;

  if (Array.isArray(warehouses)) {
    for (const w of warehouses) {
      const found = w.inventories?.find((i: any) => i.id === targetId);
      if (found) {
        targetInv = found;
        break;
      }
    }
  }

  if (!targetInv) return <div className="p-8 text-center text-red-500 font-bold mt-10 bg-white rounded-lg border border-gray-200">Record not found.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Adjust Stock</h1>
          <div className="text-sm font-bold text-teal-700 mt-1">
            {targetInv.product?.name || "Unknown Product"}
            <span className="text-gray-400 font-normal mx-2">|</span>
            Batch: <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded font-mono">{targetInv.batchNumber}</span>
          </div>
        </div>
        <Link href="/dashboard/inventory" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <AdjustStockForm inv={targetInv} />
    </div>
  );
}
