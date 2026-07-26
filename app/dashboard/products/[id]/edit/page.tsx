import { cookies } from 'next/headers';
import { updateProduct } from './actions';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getProduct(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

async function getCategories() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const headers = { 'Authorization': `Bearer ${token}` };
  try {
    const [catRes, posCatRes, unitRes] = await Promise.all([
      fetch(`${API_BASE_URL}/product-categories?activeOnly=true`, { headers, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/pos-categories?activeOnly=true`, { headers, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/units-of-measurement?activeOnly=true`, { headers, cache: 'no-store' }),
    ]);
    return {
      categories: catRes.ok ? await catRes.json() : [],
      posCategories: posCatRes.ok ? await posCatRes.json() : [],
      units: unitRes.ok ? await unitRes.json() : [],
    };
  } catch (e) {
    return { categories: [], posCategories: [], units: [] };
  }
}

// 🔥 NEXT 16 FIX: Await params and searchParams
export default async function EditProductPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ error?: string }> 
}) {
  // Unwrapping the Promises
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const [product, { categories, posCategories, units }] = await Promise.all([getProduct(resolvedParams.id), getCategories()]);
  const hasError = resolvedSearchParams.error === 'true';

  if (!product) {
    return <div className="p-8 text-center text-red-500 font-bold">Product not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Product: {product.name}</h1>
        </div>
        <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">Failed to update product.</p>
          </div>
        )}

        <form action={updateProduct} className="space-y-6">
          <input type="hidden" name="id" value={product.id} />
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" defaultValue={product.name} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price (QAR) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" name="price" defaultValue={product.price} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cost Price (QAR)</label>
              <input type="number" step="0.01" name="costPrice" defaultValue={product.costPrice || ''} placeholder="For POS COGS" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SKU</label>
              <input type="text" name="sku" defaultValue={product.sku || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">PCS Barcode</label>
              <input type="text" name="barcodePcs" defaultValue={product.barcodePcs || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Box Barcode</label>
              <input type="text" name="barcodeBox" defaultValue={product.barcodeBox || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea name="description" rows={3} defaultValue={product.description || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
              <select name="type" defaultValue={product.type || 'GOODS'} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="GOODS">Goods</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select name="categoryId" defaultValue={product.categoryId || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="">None</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">POS Category</label>
              <select name="posCategoryId" defaultValue={product.posCategoryId || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="">None</option>
                {posCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Unit of Measurement</label>
              <select name="unitId" defaultValue={product.unitId || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="">None</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
              </select>
            </div>
            <div className="col-span-2 flex items-end pb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input type="checkbox" name="posActive" defaultChecked={product.posActive !== false} className="w-4 h-4" />
                Active on POS
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}