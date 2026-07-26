import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import CancelSaleButton from './CancelSaleButton';

async function getSales() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sales`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default async function PosSalesPage() {
  const sales = await getSales();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">POS Sales</h1>
        <p className="text-sm text-gray-500 mt-1">Every walk-in sale, across all sessions.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {sales.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No POS sales yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Served By</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {sales.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.cancelledAt ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-mono font-bold text-teal-700">
                    <Link href={`/dashboard/pos/sales/${s.id}`} className="hover:underline">{s.invoiceNumber}</Link>
                    {s.cancelledAt && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700">Cancelled</span>}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDateTime(s.createdAt)}</td>
                  <td className="py-4 px-6 text-sm">{s.session?.warehouse?.name || '--'}</td>
                  <td className="py-4 px-6 text-sm font-bold">{s.clientName || 'Walk-in'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{s.servedBy?.name || '--'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{s.paymentMethod?.name}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(s.totalAmount)}</td>
                  <td className="py-4 px-6 text-right">
                    {!s.cancelledAt && <CancelSaleButton saleId={s.id} />}
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
