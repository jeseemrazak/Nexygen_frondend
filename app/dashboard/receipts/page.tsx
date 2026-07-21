import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getReceipts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/receipts`, {
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

export default async function ReceiptsDashboard() {
  const receipts = await getReceipts();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Receipts</h1>
        <p className="text-sm text-gray-500 mt-1">Every goods receipt against an ordered Purchase Order, partial or full.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {receipts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No receipts yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Receipt #</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Purchase Order</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-black">
              {receipts.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700 font-mono">{r.receiptNumber || `RCPT-${String(r.id).padStart(6, '0')}`}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="py-4 px-6 text-sm">
                    <Link href={`/dashboard/purchases/${r.purchaseOrderId}`} className="text-teal-600 hover:underline font-bold">
                      PO-{String(r.purchaseOrderId).padStart(4, '0')}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold">{r.purchaseOrder?.supplier?.name || 'Unknown'}</td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/receipts/${r.id}`}
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
