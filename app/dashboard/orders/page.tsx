import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

async function getSalesOrders(status: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const cacheBust = Date.now();

  try {
    const res = await fetch(
      `${API_BASE_URL}/sales-orders?status=${status}&t=${cacheBust}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Sales order fetch error:", error);
    return [];
  }
}

async function handleFilter(formData: FormData) {
  'use server';
  const status = formData.get('status');
  redirect(`/dashboard/orders?status=${status}`);
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-50 text-slate-700 ring-slate-600/20',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  DONE: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default async function SalesOrdersDashboard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const currentStatus = resolvedParams.status || 'ALL';

  const orders = await getSalesOrders(currentStatus);
  const statuses = ['ALL', 'DRAFT', 'CONFIRMED', 'DONE', 'CANCELLED'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Quotation → Sales Order → Delivery → Invoice → Payment.</p>
        </div>

        <form action={handleFilter} className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select
            name="status"
            defaultValue={currentStatus}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm text-black font-semibold bg-white shadow-sm"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
          </select>

          <button type="submit" className="bg-gray-900 text-white font-bold py-2 px-6 rounded-md shadow-sm hover:bg-black transition">
            Apply
          </button>

          {currentStatus !== 'ALL' && (
            <Link href="/dashboard/orders" className="text-sm font-semibold text-gray-500 underline hover:text-gray-800">
              Clear
            </Link>
          )}
        </form>

        <Link href="/dashboard/orders/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md shadow-sm transition whitespace-nowrap">
          ➕ Create Sales Order
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No sales orders found matching your filters.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Merchandiser</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-black">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-purple-700">SO-{String(order.id).padStart(4, '0')}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="py-4 px-6 text-sm font-bold">{order.clientName || 'Walk-in'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{order.user?.name || <span className="text-amber-600 font-semibold">Unassigned</span>}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${statusBadge[order.status] || statusBadge.DRAFT}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(order.totalAmount)}</td>

                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
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
