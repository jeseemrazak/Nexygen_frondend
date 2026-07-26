import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getAppModule } from '@/lib/appModules';
import NewJobOrderForm from './NewJobOrderForm';

async function getJson(path: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function NewJobOrderPage({ searchParams }: { searchParams: Promise<{ vehicleId?: string }> }) {
  const mod = await getAppModule('job-order-management');
  if (!mod?.isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Job Order module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-teal-600 hover:text-teal-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  const { vehicleId } = await searchParams;
  const [vehicles, warehouses, technicians] = await Promise.all([
    getJson('/vehicles'),
    getJson('/warehouses'),
    getJson('/users/merchandisers'),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/job-orders" className="text-teal-600 hover:text-teal-800 text-sm font-bold mb-2 inline-block">← Back to Job Orders</Link>
        <h1 className="text-2xl font-bold text-gray-800">New Job Order</h1>
        <p className="text-sm text-gray-500 mt-1">Parts and labor are added once the job order is created.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <NewJobOrderForm vehicles={vehicles} warehouses={warehouses} technicians={technicians} defaultVehicleId={vehicleId} />
      </div>
    </div>
  );
}
