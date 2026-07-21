import { createProduct } from './actions';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getWarehouses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch('http://187.127.117.99:3002/warehouses', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    return res.ok ? await res.json() : [];
  } catch (e) {
    return [];
  }
}

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const hasError = resolvedParams.error === 'true';
  const warehouses = await getWarehouses();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Register an item and optionally assign initial stock.</p>
        </div>
        <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">Failed to create product.</p>
          </div>
        )}

        <form action={createProduct} className="space-y-8">
          
          {/* SECTION 1: Product Details */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Product Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (QAR) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" name="price" required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cost Price (QAR)</label>
                <input type="number" step="0.01" name="costPrice" placeholder="For POS COGS" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">SKU</label>
                <input type="text" name="sku" placeholder="e.g. APP-001" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">PCS Barcode</label>
                <input type="text" name="barcodePcs" placeholder="Scan single unit" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Box Barcode</label>
                <input type="text" name="barcodeBox" placeholder="Scan master carton" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Initial Stock (Optional) */}
          <div className="bg-teal-50 p-6 rounded-md border border-teal-100">
            <h2 className="text-lg font-bold text-teal-900 mb-4">2. Initial Stock (Optional)</h2>
            <p className="text-sm text-teal-700 mb-4">Leave quantity blank if you do not want to add stock right now.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Destination Warehouse</label>
                <select name="warehouseId" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white">
                  <option value="">Select warehouse...</option>
                  {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Initial Quantity</label>
                <input type="number" name="initialQty" min="1" placeholder="e.g. 100" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Batch Number</label>
                <input type="text" name="batchNumber" placeholder="If left blank, defaults to 'INITIAL'" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Expiry Date</label>
                <input type="date" name="expiryDate" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save Product & Process Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
}