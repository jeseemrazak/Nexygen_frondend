import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getQuotations(status: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/quotations?status=${status}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Quotation fetch error:', error);
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const currentStatus = resolvedParams.status || 'ALL';

  const quotations = await getQuotations(currentStatus);
  const statuses = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Pre-sale quotes that can be converted into orders.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <Link
                key={s}
                href={`/dashboard/quotations?status=${s}`}
                className={`px-4 py-2 rounded-md text-sm font-bold transition ${
                  currentStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s}
              </Link>
            ))}
          </div>

          <Link href="/dashboard/quotations/new" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-md shadow-sm transition whitespace-nowrap">
            ➕ New Quotation
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {quotations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No quotations found matching your filters.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Quote ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {quotations.map((q: any) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700">QT-{String(q.id).padStart(4, '0')}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(q.createdAt)}</td>
                  <td className="py-4 px-6 text-sm font-bold">{q.clientName || 'Walk-in'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      q.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700' :
                      q.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700' :
                      q.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(q.totalAmount)}</td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/quotations/${q.id}`}
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
