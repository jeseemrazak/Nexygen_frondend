import { cookies } from 'next/headers';
import Link from 'next/link';
import Form from 'next/form';
import { API_BASE_URL } from '@/lib/config';

async function getInventoryData(query: string, status: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  // Decide whether to fetch filtered search results or the full list
  const productUrl = query
    ? `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`
    : `${API_BASE_URL}/products`;

  try {
    const [wRes, pRes] = await Promise.all([
      fetch(`${API_BASE_URL}/warehouses`, {
        headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' 
      }),
      fetch(productUrl, { 
        headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' 
      })
    ]);

    return {
      warehouses: wRes.ok ? await wRes.json() : [],
      products: pRes.ok ? await pRes.json() : []
    };
  } catch (e) {
    return { warehouses: [], products: [] };
  }
}

export default async function InventoryReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; status?: string }> 
}) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q || '';
  const statusFilter = resolvedParams.status || 'all';

  const { warehouses, products } = await getInventoryData(searchQuery, statusFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Stock Report</h1>
          <p className="text-sm text-gray-500 mt-1">Search by Name, SKU, or Barcode.</p>
        </div>
        
        <Form action="/dashboard/inventory" className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="text" 
            name="q" 
            defaultValue={searchQuery}
            placeholder="Search..." 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full md:w-64"
          />
          <select name="status" defaultValue={statusFilter} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
            <option value="all">All Products</option>
            <option value="inStock">Available</option>
            <option value="empty">Out of Stock</option>
          </select>
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md text-sm">
            Filter
          </button>
          {searchQuery && (
            <Link href="/dashboard/inventory" className="text-gray-500 underline text-sm">Clear</Link>
          )}
        </Form>
      </div>

      {warehouses.map((warehouse: any) => (
        <div key={warehouse.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-800 text-white px-6 py-4">
            <h2 className="text-lg font-bold">{warehouse.name}</h2>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Product</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">SKU</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">PCS Barcode</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Box Barcode</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Batch</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Expiry</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Stock</th>
      <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
    </tr>
  </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No products found matching your search.</td>
                </tr>
              ) : (
                products.map((product: any) => {
                  const batches = warehouse.inventories?.filter((inv: any) => inv.productId === product.id) || [];
                  const totalStock = batches.reduce((s: number, b: any) => s + b.quantity, 0);

                  if (statusFilter === 'inStock' && totalStock === 0) return null;
                  if (statusFilter === 'empty' && totalStock > 0) return null;

                  if (batches.length === 0) return (
                  <tr key={`empty-${product.id}`} className="bg-red-50/30">
          <td className="py-4 px-6 font-medium text-gray-800">{product.name}</td>
          <td className="py-4 px-6 text-xs font-mono">{product.sku || '--'}</td>
          <td className="py-4 px-6 text-xs font-mono">{product.barcodePcs || '--'}</td>
          <td className="py-4 px-6 text-xs font-mono">{product.barcodeBox || '--'}</td>
          <td className="py-4 px-6 text-sm text-gray-400">--</td>
          <td className="py-4 px-6 text-sm text-gray-400">--</td>
          <td className="py-4 px-6 text-right font-bold text-red-600">0</td>
          <td className="py-4 px-6 text-right">
            <Link href={`/dashboard/inventory/add?productId=${product.id}&warehouseId=${warehouse.id}`} className="text-teal-600 underline text-sm font-semibold">+ Add Stock</Link>
          </td>
        </tr>
                  );

                  return batches.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50 border-b">
          <td className="py-4 px-6 font-medium text-gray-800">{product.name}</td>
          <td className="py-4 px-6 text-xs font-mono text-gray-500">{product.sku || '--'}</td>
          <td className="py-4 px-6 text-xs font-mono text-gray-500">{product.barcodePcs || '--'}</td>
          <td className="py-4 px-6 text-xs font-mono text-gray-500">{product.barcodeBox || '--'}</td>
          <td className="py-4 px-6 text-sm font-mono">{inv.batchNumber}</td>
          <td className="py-4 px-6 text-sm">
            {inv.expiryDate 
              ? new Date(inv.expiryDate).toLocaleDateString('en-QA', { month: 'short', year: 'numeric' }) 
              : <span className="text-gray-300 italic">N/A</span>}
          </td>
          <td className="py-4 px-6 text-right font-bold">{inv.quantity}</td>
          <td className="py-4 px-6 text-right">
            <Link href={`/dashboard/inventory/${inv.id}/edit`} className="text-yellow-600 underline text-sm font-semibold">Adjust</Link>
          </td>
        </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}