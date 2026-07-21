import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getSuppliers() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/suppliers`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function SuppliersListPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the vendors you purchase stock from.</p>
        </div>

        <Link
          href="/dashboard/suppliers/new"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center gap-2"
        >
          <span>➕</span> Add Supplier
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No suppliers found. Click "Add Supplier" to get started.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Person</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {suppliers.map((supplier: any) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-800">{supplier.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{supplier.contactPerson || <span className="italic text-gray-400">--</span>}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{supplier.phone || <span className="italic text-gray-400">--</span>}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{supplier.email || <span className="italic text-gray-400">--</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
