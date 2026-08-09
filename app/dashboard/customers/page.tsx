import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import CustomersTable from './CustomersTable';

async function getCustomers() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function CustomersListPage() {
  const customers = await getCustomers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the clients you sell to.</p>
        </div>

        <Link
          href="/dashboard/customers/new"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center gap-2"
        >
          <span>➕</span> Add Customer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <CustomersTable initialCustomers={customers} />
      </div>
    </div>
  );
}
