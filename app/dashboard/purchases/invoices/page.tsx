import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getBills() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/bills`, {
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

export default async function PurchaseInvoicesPage() {
  const bills = await getBills();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Bills from suppliers &amp; what's still owed.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {bills.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No purchase bills yet — create one from a Purchase Order's detail page.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Bill #</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Paid</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Payment Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {bills.map((bill: any) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700 font-mono">{bill.billNumber || `BILL-${String(bill.id).padStart(6, '0')}`}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(bill.createdAt)}</td>
                  <td className="py-4 px-6 text-sm font-bold">{bill.purchaseOrder?.supplier?.name || 'Unknown'}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(bill.totalAmount)}</td>
                  <td className="py-4 px-6 text-right text-sm text-gray-600">{formatQAR(bill.amountPaid || 0)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      bill.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      bill.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {bill.paymentStatus || 'UNPAID'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/bills/${bill.id}`}
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
