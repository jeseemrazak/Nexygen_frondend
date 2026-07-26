'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const SOURCE_LABELS: Record<string, string> = { PARTY: 'Register Payment', SALES_INVOICE: 'Invoice Payment', PURCHASE_BILL: 'Bill Payment' };
const SOURCE_COLORS: Record<string, string> = {
  PARTY: 'bg-purple-50 text-purple-700',
  SALES_INVOICE: 'bg-emerald-50 text-emerald-700',
  PURCHASE_BILL: 'bg-amber-50 text-amber-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/payments`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setPayments(await res.json());
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Record one payment and allocate it across multiple open invoices or bills.</p>
        </div>
        <Link href="/dashboard/accounting/payments/new" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md text-sm transition">
          ➕ Register Payment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No payments recorded yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Payment #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Source</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Party</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Method</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {payments.map((p: any) => (
                <tr key={`${p.source}-${p.id}`} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700 font-mono">
                    <Link href={`/dashboard/accounting/payments/${p.id}?source=${p.source}`} className="hover:underline">
                      {p.paymentNumber || `#${p.id}`}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${SOURCE_COLORS[p.source] || 'bg-gray-50 text-gray-700'}`}>
                      {SOURCE_LABELS[p.source] || p.source}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDateTime(p.createdAt)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase mr-2 ${p.partyType === 'CUSTOMER' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                      {p.partyType}
                    </span>
                    <span className="font-bold">{p.partyName}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.method || '--'}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(p.amount)}</td>
                  <td className="py-4 px-6 text-right text-sm text-gray-500">{p.documentCount} document(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
