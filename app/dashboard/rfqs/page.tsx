import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getRfqs(status: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/rfqs?status=${status}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('RFQ fetch error:', error);
    return [];
  }
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default async function RfqsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const currentStatus = resolvedParams.status || 'ALL';

  const rfqs = await getRfqs(currentStatus);
  const statuses = ['ALL', 'DRAFT', 'SENT', 'CLOSED', 'CONVERTED', 'CANCELLED'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Requests for Quotation</h1>
          <p className="text-sm text-gray-500 mt-1">Compare pricing from multiple suppliers before ordering.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <Link
                key={s}
                href={`/dashboard/rfqs?status=${s}`}
                className={`px-4 py-2 rounded-md text-sm font-bold transition ${
                  currentStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s}
              </Link>
            ))}
          </div>

          <Link href="/dashboard/rfqs/new" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-md shadow-sm transition whitespace-nowrap">
            ➕ New RFQ
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rfqs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No RFQs found matching your filters.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">RFQ ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Warehouse</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Responses</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {rfqs.map((rfq: any) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700">RFQ-{String(rfq.id).padStart(4, '0')}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(rfq.createdAt)}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{rfq.warehouse?.name || 'Unknown'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{rfq.items?.length || 0} line(s)</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{rfq.responses?.length || 0} supplier(s)</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      rfq.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700' :
                      rfq.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/rfqs/${rfq.id}`}
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
