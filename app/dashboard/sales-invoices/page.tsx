import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getInvoices() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function SalesInvoicesPage() {
  const invoiced = await getInvoices();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Sales Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Invoicing &amp; payment status across all orders.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {invoiced.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No sales invoices yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Paid</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Payment Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {invoiced.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-purple-700 font-mono">{inv.invoiceNumber}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(inv.createdAt)}</td>
                  <td className="py-4 px-6 text-sm font-bold">{inv.salesOrder?.clientName || 'Walk-in'}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(inv.totalAmount)}</td>
                  <td className="py-4 px-6 text-right text-sm text-gray-600">{formatQAR(inv.amountPaid || 0)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      inv.paymentStatus === 'PAID' ? 'bg-purple-50 text-purple-700' :
                      inv.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {inv.paymentStatus || 'UNPAID'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/sales-invoices/${inv.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold transition"
                    >
                      View / Pay
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
