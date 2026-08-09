import { cookies } from 'next/headers';
import Link from 'next/link';
import Form from 'next/form';
import ImportProductsButton from './ImportProductsButton'; // 🔥 Import the new client component!
import ArchiveProductButton from './ArchiveProductButton';
import { API_BASE_URL } from '@/lib/config';

async function getProducts(showArchived: boolean) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const url = `${API_BASE_URL}/products${showArchived ? '' : '?activeOnly=true'}`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function ProductCatalogPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; showArchived?: string }>
}) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q || '';
  const showArchived = resolvedParams.showArchived === 'true';

  const products = await getProducts(showArchived);

  const filteredProducts = products.filter((p: any) => {
    if (!searchQuery) return true;
    
    const nameMatch = p.name.toLowerCase().includes(searchQuery);
    const skuMatch = p.sku?.toLowerCase().includes(searchQuery);
    const pcsMatch = p.barcodePcs?.toLowerCase().includes(searchQuery);
    const boxMatch = p.barcodeBox?.toLowerCase().includes(searchQuery);

    return nameMatch || skuMatch || pcsMatch || boxMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Filter Row */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage items, barcodes, and track global stock levels.</p>
        </div>

        {/* Action Bar (Search + Import + Add) */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <Form action="/dashboard/products" className="flex items-center gap-3 w-full">
            <input 
              type="text" 
              name="q" 
              defaultValue={searchQuery}
              placeholder="Search name, SKU, or barcode..." 
              className="border border-gray-300 rounded-md px-4 py-2 text-sm text-black focus:outline-teal-500 w-full md:w-72 shadow-sm"
              autoFocus
            />
            <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md border border-gray-300 shadow-sm transition">
              Search
            </button>
            {searchQuery && (
              <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-800 text-sm font-semibold underline whitespace-nowrap">
                Clear
              </Link>
            )}
          </Form>

          {/* 🔥 THE NEW IMPORT BUTTON */}
          <ImportProductsButton />

          <Link
            href="/dashboard/products/categories"
            className="text-gray-500 hover:text-gray-800 text-sm font-semibold underline whitespace-nowrap"
          >
            Categories
          </Link>

          <Link
            href={`/dashboard/products?${showArchived ? '' : 'showArchived=true'}${searchQuery ? `${showArchived ? '' : '&'}q=${encodeURIComponent(searchQuery)}` : ''}`}
            className="text-gray-500 hover:text-gray-800 text-sm font-semibold underline whitespace-nowrap"
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Link>

          <Link
            href="/dashboard/products/new"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-md shadow-sm transition whitespace-nowrap w-full md:w-auto text-center"
          >
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-bold text-gray-700">
              {searchQuery ? `No products match "${searchQuery}".` : "No products found in the catalog."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU (Internal)</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">PCS Barcode</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Box Barcode</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Cost Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Total Qty (All Whs)</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {filteredProducts.map((product: any) => {
                
                const totalStock = product.inventories?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-800">
                      {product.name}
                      {product.type === 'SERVICE' && (
                        <span className="ml-2 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full align-middle">Service</span>
                      )}
                      {product.isActive === false && (
                        <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full align-middle">Archived</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-sm text-gray-600">
                      {product.category?.name || <span className="text-gray-400 italic">--</span>}
                    </td>

                    <td className="py-4 px-6 text-sm text-gray-600">
                      {product.unit?.abbreviation || <span className="text-gray-400 italic">--</span>}
                    </td>

                    <td className="py-4 px-6 text-sm font-mono text-gray-600">
                      {product.sku || <span className="text-gray-400 italic">--</span>}
                    </td>
                    
                    <td className="py-4 px-6 text-sm font-mono text-gray-600">
                      {product.barcodePcs || <span className="text-gray-400 italic">--</span>}
                    </td>
                    
                    <td className="py-4 px-6 text-sm font-mono text-gray-600">
                      {product.barcodeBox || <span className="text-gray-400 italic">--</span>}
                    </td>

                    <td className="py-4 px-6 text-sm text-right text-gray-700">
                      {new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(product.price || 0)}
                    </td>

                    <td className="py-4 px-6 text-sm text-right text-gray-700">
                      {product.costPrice ? (
                        new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(product.costPrice)
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        totalStock === 0 ? 'bg-red-100 text-red-700' : 
                        totalStock < 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {totalStock}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="text-teal-600 hover:text-teal-800 font-semibold text-sm underline"
                        >
                          Edit Details
                        </Link>
                        <ArchiveProductButton productId={product.id} isActive={product.isActive !== false} />
                      </div>
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