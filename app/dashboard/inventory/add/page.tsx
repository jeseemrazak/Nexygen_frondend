import Link from 'next/link';
import { cookies } from 'next/headers';
import { initializeStock } from './actions';
import { API_BASE_URL } from '@/lib/config';

// 🔥 NEXT 16 FIX: Define searchParams as a Promise
export default async function AddInitialStockPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ productId: string, warehouseId: string }> 
}) {
  // 🔥 NEXT 16 FIX: Await the promise to get the actual strings!
  const resolvedParams = await searchParams;
  const { productId, warehouseId } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const headers = { 'Authorization': `Bearer ${token}` };

  const [productRes, warehouseRes] = await Promise.all([
    fetch(`${API_BASE_URL}/products/${productId}`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/warehouses/${warehouseId}`, { headers, cache: 'no-store' })
  ]);

  const product = await productRes.json();
  const warehouse = await warehouseRes.json();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Add Initial Stock</h1>
          <p className="text-sm font-bold text-teal-600 mt-1">{product.name} ➔ {warehouse.name}</p>
        </div>
        <Link href="/dashboard/inventory" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-teal-500">
        <form action={initializeStock} className="space-y-6">
          {/* 🔥 Now these hidden inputs will contain actual numbers instead of empty strings */}
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="warehouseId" value={warehouseId} />
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Initial Quantity</label>
            <input type="number" name="quantity" min="1" required placeholder="e.g. 100" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Batch Number</label>
            <input type="text" name="batchNumber" required placeholder="Scan or type batch..." className="w-full border border-gray-300 rounded-md px-4 py-3 text-black font-mono" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date <span className="font-normal text-gray-400">(Optional)</span></label>
            <input type="date" name="expiryDate" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md shadow-sm">
              Initialize Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}