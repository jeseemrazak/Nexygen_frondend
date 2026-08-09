import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getSession(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sessions/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (d: string) => new Date(d).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-QA', { hour: 'numeric', minute: '2-digit', hour12: true });

export default async function PosSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) return <div className="p-8 text-center text-rose-500 font-bold">Session not found.</div>;

  const activeSales = session.sales.filter((s: any) => !s.cancelledAt);
  const totalTakings = activeSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
  const totalDiscount = activeSales.reduce((sum: number, s: any) => sum + s.discountAmount, 0);
  const cancelledCount = session.sales.length - activeSales.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <Link href="/dashboard/pos/sessions" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">← Back to Sessions</Link>
          <h1 className="text-2xl font-bold text-gray-800">Session #{session.id} — {session.warehouse?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Opened {formatDateTime(session.openedAt)}{session.openedBy ? ` by ${session.openedBy.name}` : ''}
            {session.closedAt && <> · Closed {formatDateTime(session.closedAt)}{session.closedBy ? ` by ${session.closedBy.name}` : ''}</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${session.status === 'OPEN' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            {session.status}
          </span>
          <Link href={`/dashboard/pos/sessions/${id}/print`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all">
            🖨️ Print
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase">Transactions</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{activeSales.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase">Total Discount</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatQAR(totalDiscount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase">Cancelled Sales</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{cancelledCount}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg shadow-sm">
          <p className="text-xs font-bold text-slate-300 uppercase">Total Takings</p>
          <p className="text-xl font-bold text-white mt-1">{formatQAR(totalTakings)}</p>
        </div>
      </div>

      {(session.openingCash != null || session.expectedCash != null || session.countedCash != null) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">Cash Drawer</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Opening Cash</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{session.openingCash != null ? formatQAR(session.openingCash) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Expected Cash</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{session.expectedCash != null ? formatQAR(session.expectedCash) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Counted Cash</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{session.countedCash != null ? formatQAR(session.countedCash) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Variance</p>
              <p className={`text-lg font-bold mt-1 ${
                session.cashVariance == null ? 'text-gray-800' : session.cashVariance === 0 ? 'text-purple-600' : session.cashVariance > 0 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {session.cashVariance != null ? `${session.cashVariance > 0 ? '+' : ''}${formatQAR(session.cashVariance)}` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {session.sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No sales in this session.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Time</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Sale #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Staff</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Method</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {session.sales.map((s: any) => (
                <tr key={s.id} className={s.cancelledAt ? 'opacity-50' : ''}>
                  <td className="py-3 px-6 text-sm text-gray-600">{formatTime(s.createdAt)}</td>
                  <td className="py-3 px-6 text-sm font-mono">
                    <Link href={`/dashboard/pos/sales/${s.id}`} className="text-purple-600 hover:text-purple-800 font-bold">{s.invoiceNumber}</Link>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-600">{s.servedBy?.name || '—'}</td>
                  <td className="py-3 px-6 text-sm text-gray-600">{s.paymentMethod?.name}</td>
                  <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(s.totalAmount)}</td>
                  <td className="py-3 px-6 text-sm">
                    {s.cancelledAt ? <span className="text-rose-600 font-bold text-xs">CANCELLED</span> : <span className="text-purple-600 font-bold text-xs">OK</span>}
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
