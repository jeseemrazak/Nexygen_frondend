import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getVehicle(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) return <div className="p-8 text-center text-rose-500 font-bold">Vehicle not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start">
        <div>
          <Link href="/dashboard/vehicles" className="text-teal-600 hover:text-teal-800 text-sm font-bold mb-2 inline-block">← Back to Vehicles</Link>
          <h1 className="text-2xl font-bold text-gray-800 font-mono">{vehicle.plateNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'No make/model on file'}
            {vehicle.customer && <> · Owner: {vehicle.customer.name}</>}
          </p>
          {vehicle.vin && <p className="text-xs text-gray-400 mt-1 font-mono">VIN: {vehicle.vin}</p>}
        </div>
        <Link
          href={`/dashboard/job-orders/new?vehicleId=${vehicle.id}`}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm whitespace-nowrap"
        >
          + New Job Order
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Job Orders</h2>
        </div>
        {vehicle.jobOrders?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No job orders for this vehicle yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Job #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {vehicle.jobOrders.map((jo: any) => (
                <tr key={jo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-mono">
                    <Link href={`/dashboard/job-orders/${jo.id}`} className="text-teal-600 hover:text-teal-800 font-bold">{jo.jobNumber}</Link>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-500">{formatDate(jo.createdAt)}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[jo.status]}`}>{jo.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(jo.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
