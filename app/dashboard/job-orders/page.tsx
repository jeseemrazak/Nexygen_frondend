import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getAppModule } from '@/lib/appModules';

async function getJobOrders(status?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const url = new URL(`${API_BASE_URL}/job-orders`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default async function JobOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const mod = await getAppModule('job-order-management');

  if (!mod?.isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Job Order module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-purple-600 hover:text-purple-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  const { status } = await searchParams;
  const jobOrders = await getJobOrders(status);
  const statuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Fleet job cards — parts, labor, and status per vehicle visit.</p>
        </div>
        <Link href="/dashboard/job-orders/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">
          + New Job Order
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/job-orders" className={`px-4 py-1.5 rounded-full text-xs font-bold ${!status ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>All</Link>
        {statuses.map((s) => (
          <Link key={s} href={`/dashboard/job-orders?status=${s}`} className={`px-4 py-1.5 rounded-full text-xs font-bold ${status === s ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {jobOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No job orders found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Job #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Vehicle</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Technician</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {jobOrders.map((jo: any) => (
                <tr key={jo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-mono">
                    <Link href={`/dashboard/job-orders/${jo.id}`} className="text-purple-600 hover:text-purple-800 font-bold">{jo.jobNumber}</Link>
                  </td>
                  <td className="py-3 px-6 text-sm font-mono text-gray-600">{jo.vehicle?.plateNumber}</td>
                  <td className="py-3 px-6 text-sm text-gray-500">{jo.customer?.name || '--'}</td>
                  <td className="py-3 px-6 text-sm text-gray-500">{jo.technician?.name || '--'}</td>
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
