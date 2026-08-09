'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function QuotationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchQuotation();
  }, []);

  const fetchQuotation = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/quotations/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setQuotation(data);
      }
    } catch (error) {
      console.error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/quotations/${params.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchQuotation();
    } else {
      const err = await safeJson(res);
      alert(`Error: ${err?.message || 'Failed to update status.'}`);
    }
  };

  const handleConvert = async () => {
    if (!quotation) return;

    setIsConverting(true);
    setErrorMessage('');
    const token = getClientToken();

    const res = await fetch(`${API_BASE_URL}/quotations/${params.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      const updated = await res.json();
      router.push(`/dashboard/orders/${updated.convertedOrderId}`);
    } else {
      const err = await safeJson(res);
      setErrorMessage(err?.message || 'Failed to convert quotation.');
      setIsConverting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Quotation...</div>;
  if (!quotation) return <div className="p-8 text-center text-rose-500 font-bold">Quotation not found.</div>;

  const canConvert = quotation.status !== 'REJECTED' && quotation.status !== 'CONVERTED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 font-sans">

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href="/dashboard/quotations" className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Quotations
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            QT-{quotation.id.toString().padStart(4, '0')}
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ring-slate-200">
              {quotation.status}
            </span>
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">📅</span> {formatDateTime(quotation.createdAt)}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏭</span> {quotation.warehouse?.name || 'Unknown Warehouse'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏢</span> Client: <span className="font-bold text-slate-800">{quotation.clientName || 'Walk-in'}</span>
            </p>
            {quotation.validUntil && (
              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="text-slate-400">⏳</span> Valid until: {formatDateTime(quotation.validUntil)}
              </p>
            )}
            {quotation.customerReference && (
              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="text-slate-400">🔖</span> Ref: <span className="font-bold text-slate-800">{quotation.customerReference}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link
              href={`/dashboard/quotations/${quotation.id}/print`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all"
            >
              🖨️ Print
            </Link>
            {quotation.status === 'DRAFT' && (
              <>
                <button onClick={() => updateStatus('SENT')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all">Mark Sent</button>
                <button onClick={() => updateStatus('REJECTED')} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2.5 px-6 rounded-lg transition-all">Reject</button>
              </>
            )}
            {quotation.status === 'SENT' && (
              <>
                <button onClick={() => updateStatus('ACCEPTED')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all">Mark Accepted</button>
                <button onClick={() => updateStatus('REJECTED')} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2.5 px-6 rounded-lg transition-all">Reject</button>
              </>
            )}
            {quotation.status === 'CONVERTED' && quotation.convertedOrder && (
              <Link href={`/dashboard/orders/${quotation.convertedOrder.id}`} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all">
                View Order #{quotation.convertedOrder.id}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Quoted Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Qty</th>
                <th className="py-4 px-6 text-right">Unit Price</th>
                <th className="py-4 px-6 text-right">Discount</th>
                <th className="py-4 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {quotation.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{item.product?.name}</td>
                  <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantity}</td>
                  <td className="py-4 px-6 text-right text-slate-600">
                    {item.listPrice && item.listPrice !== item.price ? (
                      <>
                        <span className="line-through text-slate-400 mr-1">{formatQAR(item.listPrice)}</span>
                        {formatQAR(item.price)}
                      </>
                    ) : formatQAR(item.price)}
                  </td>
                  <td className="py-4 px-6 text-right text-rose-600">
                    {item.lineDiscountType ? (item.lineDiscountType === 'PERCENT' ? `${item.lineDiscountValue}%` : formatQAR(item.lineDiscountValue)) : '—'}
                  </td>
                  <td className="py-4 px-6 text-right font-bold">{formatQAR(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5">
            <p className="flex justify-between text-sm text-slate-600"><span>Subtotal</span> <span className="font-semibold">{formatQAR(quotation.subtotal || quotation.totalAmount)}</span></p>
            {quotation.discountType && quotation.discountValue > 0 && (
              <p className="flex justify-between text-sm text-rose-600">
                <span>Discount {quotation.discountType === 'PERCENT' ? `(${quotation.discountValue}%)` : ''}</span>
                <span className="font-semibold">-{formatQAR((quotation.subtotal || quotation.totalAmount) - quotation.totalAmount + (quotation.taxAmount || 0))}</span>
              </p>
            )}
            {quotation.taxAmount > 0 && (
              <p className="flex justify-between text-sm text-slate-600">
                <span>Tax{quotation.tax?.name ? ` (${quotation.tax.name})` : ''}</span>
                <span className="font-semibold">{formatQAR(quotation.taxAmount)}</span>
              </p>
            )}
            <p className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200"><span>Total</span> <span>{formatQAR(quotation.totalAmount)}</span></p>
          </div>
        </div>

        {quotation.termsAndConditions && (
          <div className="px-6 py-5 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Terms &amp; Conditions</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.termsAndConditions}</p>
          </div>
        )}

        {canConvert && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-3">Converting creates a draft Sales Order. Merchandiser is assigned afterward when it's confirmed, and delivery/invoicing happen from there.</p>
            {errorMessage && <p className="text-rose-600 text-sm font-semibold mb-3">{errorMessage}</p>}
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-md shadow-sm disabled:bg-gray-400"
            >
              {isConverting ? 'Converting...' : 'Convert to Sales Order'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
