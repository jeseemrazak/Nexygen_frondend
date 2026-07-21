import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

async function getDeliveries() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/deliveries`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SHIPPED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default async function DeliveriesDashboard() {
  const deliveries = await getDeliveries();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">Every shipment against a confirmed Sales Order, partial or full.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No deliveries yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Delivery ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Sales Order</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-black">
              {deliveries.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700">DEL-{String(d.id).padStart(4, '0')}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(d.createdAt)}</td>
                  <td className="py-4 px-6 text-sm">
                    <Link href={`/dashboard/orders/${d.salesOrderId}`} className="text-teal-600 hover:underline font-bold">
                      SO-{String(d.salesOrderId).padStart(4, '0')}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold">{d.salesOrder?.clientName || 'Walk-in'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${statusBadge[d.status] || statusBadge.PENDING}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/deliveries/${d.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold transition"
                    >
                      View Details
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
