'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const SOURCE_LABELS: Record<string, string> = { PARTY: 'Register Payment', SALES_INVOICE: 'Invoice Payment', PURCHASE_BILL: 'Bill Payment' };

export default function PaymentDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <PaymentDetailContent />
    </Suspense>
  );
}

function PaymentDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || 'PARTY';

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/payments/${params.id}?source=${source}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setPayment(await res.json());
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, source]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!payment) return <div className="p-8 text-center text-rose-500 font-bold">Payment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/accounting/payments" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to Payments
        </Link>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-mono">{payment.paymentNumber || `#${payment.id}`}</h1>
            <p className="text-sm text-gray-500 mt-1">{SOURCE_LABELS[payment.source] || payment.source}</p>
          </div>
          <a
            href={`/dashboard/accounting/payments/${payment.id}/print?source=${payment.source}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap"
          >
            🖨️ Print Voucher
          </a>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Party</p>
          <p className="mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase mr-2 ${payment.partyType === 'CUSTOMER' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
              {payment.partyType}
            </span>
            <span className="font-bold text-gray-800">{payment.partyName}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Date</p>
          <p className="mt-1 font-bold text-gray-800">{formatDateTime(payment.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Amount</p>
          <p className="mt-1 font-bold text-teal-700 text-xl">{formatQAR(payment.amount)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Method</p>
          <p className="mt-1 font-bold text-gray-800">{payment.method || '--'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Journal</p>
          <p className="mt-1 font-bold text-gray-800">{payment.journalName || 'Default (Cash)'}</p>
        </div>
        {payment.notes && (
          <div className="col-span-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Notes</p>
            <p className="mt-1 text-gray-700">{payment.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Allocated Documents</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Document #</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Amount Allocated</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-black">
            {payment.allocations.map((a: any, i: number) => (
              <tr key={i}>
                <td className="py-3 px-6 font-mono font-bold text-sm">{a.documentNumber || `#${a.sourceId}`}</td>
                <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(a.amountAllocated)}</td>
                <td className="py-3 px-6 text-right text-sm">
                  <Link
                    href={a.sourceType === 'SALES_INVOICE' ? `/dashboard/sales-invoices/${a.sourceId}` : `/dashboard/bills/${a.sourceId}`}
                    className="text-teal-600 hover:text-teal-800 font-bold"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
