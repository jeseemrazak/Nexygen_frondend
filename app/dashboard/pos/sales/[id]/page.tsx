import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import CancelSaleButton from '../CancelSaleButton';

async function getSale(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sales/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default async function PosSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sale = await getSale(resolvedParams.id);
  if (!sale) return <div className="p-8 text-center text-rose-500 font-bold">POS sale not found.</div>;

  const subtotal = sale.totalAmount + sale.discountAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/pos/sales" className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to POS Sales
        </Link>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-mono flex items-center gap-2">
              {sale.invoiceNumber}
              {sale.cancelledAt && <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-rose-50 text-rose-700">Cancelled</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{formatDateTime(sale.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/dashboard/pos/sales/${sale.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap"
            >
              🖨️ Print Receipt
            </a>
            {!sale.cancelledAt && <CancelSaleButton saleId={sale.id} />}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Client</p>
          <p className="mt-1 font-bold text-gray-800">{sale.clientName || 'Walk-in'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Warehouse</p>
          <p className="mt-1 font-bold text-gray-800">{sale.session?.warehouse?.name || '--'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Served By</p>
          <p className="mt-1 font-bold text-gray-800">{sale.servedBy?.name || '--'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Payment Method</p>
          <p className="mt-1 font-bold text-gray-800">{sale.paymentMethod?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Items</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Product</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Batch</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Qty</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Unit Price</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-black">
            {sale.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-3 px-6 font-bold text-sm">{item.product?.name}</td>
                <td className="py-3 px-6 text-sm text-gray-500 font-mono">{item.batchNumber}</td>
                <td className="py-3 px-6 text-right text-sm">{item.quantity}</td>
                <td className="py-3 px-6 text-right text-sm">{formatQAR(item.price)}</td>
                <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-100">
              <td colSpan={4} className="py-2 px-6 text-right text-sm text-gray-500">Subtotal</td>
              <td className="py-2 px-6 text-right text-sm text-gray-700">{formatQAR(subtotal)}</td>
            </tr>
            {sale.discountAmount > 0 && (
              <tr>
                <td colSpan={4} className="py-2 px-6 text-right text-sm text-gray-500">Discount</td>
                <td className="py-2 px-6 text-right text-sm text-rose-600">-{formatQAR(sale.discountAmount)}</td>
              </tr>
            )}
            <tr className="border-t-2 border-gray-800">
              <td colSpan={4} className="py-3 px-6 text-right font-black text-gray-800">Total</td>
              <td className="py-3 px-6 text-right font-black text-gray-800">{formatQAR(sale.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
