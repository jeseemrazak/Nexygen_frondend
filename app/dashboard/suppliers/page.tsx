import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import SuppliersTable from './SuppliersTable';

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
        <SuppliersTable initialSuppliers={suppliers} />
      </div>
    </div>
  );
}
