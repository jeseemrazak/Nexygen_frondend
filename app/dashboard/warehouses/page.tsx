import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

// Our bulletproof parser from earlier
async function parseSafe(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`Failed to parse JSON: "${text}"`);
    return []; 
  }
}

async function getWarehouses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/warehouses`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return await parseSafe(res);
  } catch (error) {
    return [];
  }
}

export default async function WarehousesListPage() {
  const warehouses = await getWarehouses();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your storage locations and distribution centers.</p>
        </div>
        
        <Link 
          href="/dashboard/warehouses/new" 
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center gap-2"
        >
          <span>➕</span> Add Warehouse
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {warehouses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No warehouses found. Click "Add Warehouse" to get started.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Unique Items in Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {warehouses.map((warehouse: any) => (
                <tr key={warehouse.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-500">#{warehouse.id}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">
                    <Link href={`/dashboard/warehouses/${warehouse.id}`} className="text-teal-700 hover:underline">
                      {warehouse.name}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{warehouse.location || <span className="italic text-gray-400">Not specified</span>}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-right">
                    <Link href={`/dashboard/warehouses/${warehouse.id}`} className="text-teal-700 hover:underline">
                      {warehouse.inventories?.length || 0}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}