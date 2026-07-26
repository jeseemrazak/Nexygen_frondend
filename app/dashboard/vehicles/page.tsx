import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getAppModule } from '@/lib/appModules';
import VehiclesTable from './VehiclesTable';
import AddVehicleForm from './AddVehicleForm';

async function getVehicles() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCustomers() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/customers`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function VehiclesPage() {
  const mod = await getAppModule('vehicle-management');

  if (!mod?.isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Vehicle Management module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-teal-600 hover:text-teal-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  const [vehicles, customers] = await Promise.all([getVehicles(), getCustomers()]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
        <p className="text-sm text-gray-500 mt-1">The vehicle registry Job Orders are built against.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Add Vehicle</h2>
        <AddVehicleForm customers={customers} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <VehiclesTable initialVehicles={vehicles} customers={customers} />
      </div>
    </div>
  );
}
