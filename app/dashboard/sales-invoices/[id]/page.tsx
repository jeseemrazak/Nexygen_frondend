'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function SalesInvoiceDetailsPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentJournalId, setPaymentJournalId] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/journals?activeOnly=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setJournals(await res.json());
    } catch (error) {
      console.error('Failed to load journals');
    }
  };

  const fetchInvoiceDetails = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setInvoice(await res.json());
    } catch (error) {
      console.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Enter a valid payment amount.');
      return;
    }

    setIsRecordingPayment(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, method: paymentMethod || undefined, journalId: paymentJournalId ? Number(paymentJournalId) : undefined }),
      });

      if (res.ok) {
        setPaymentAmount('');
        setPaymentMethod('');
        setPaymentJournalId('');
        await fetchInvoiceDetails();
      } else {
        const errData = await res.json();
        setPaymentError(errData.message || 'Failed to record payment.');
      }
    } catch (error) {
      setPaymentError('Network error while recording payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice || !confirm('Cancel this invoice? This will reverse its accounting entries and cannot be undone.')) return;
    setIsCancelling(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${invoice.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchInvoiceDetails();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to cancel invoice.');
      }
    } catch (error) {
      alert('Network error while cancelling invoice.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Invoice...</div>;
  if (!invoice) return <div className="p-8 text-center text-rose-500 font-bold">Invoice not found.</div>;

  const canCancel = !invoice.cancelledAt && !(invoice.amountPaid > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/dashboard/sales-invoices" className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
          ← Back to Sales Invoices
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
          {invoice.invoiceNumber || `Invoice #${invoice.id}`}
          {invoice.cancelledAt ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset bg-slate-100 text-slate-600 ring-slate-300">
              CANCELLED
            </span>
          ) : (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${
              invoice.paymentStatus === 'PAID' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
              invoice.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
              'bg-rose-50 text-rose-700 ring-rose-600/20'
            }`}>
              {invoice.paymentStatus || 'UNPAID'}
            </span>
          )}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">📅</span> {formatDateTime(invoice.createdAt)}
          </p>
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">🏢</span> Client: <span className="font-bold text-slate-800">{invoice.salesOrder?.clientName || 'Walk-in'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">📦</span> <Link href={`/dashboard/orders/${invoice.salesOrderId}`} className="text-purple-600 hover:underline font-bold">View Sales Order #{invoice.salesOrderId}</Link>
          </p>
          <Link
            href={`/dashboard/sales-invoices/${invoice.id}/print`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-lg text-xs transition-all"
          >
            🖨️ Print
          </Link>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-4 rounded-lg border border-rose-200 text-xs transition-all disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : '✕ Cancel Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* MANIFEST (READ ONLY) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Invoice Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Qty</th>
                <th className="py-4 px-6 text-right">Unit Price</th>
                <th className="py-4 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {invoice.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{item.product?.name}</td>
                  <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantity}</td>
                  <td className="py-4 px-6 text-right text-slate-600">{formatQAR(item.price)}</td>
                  <td className="py-4 px-6 text-right font-bold">{formatQAR(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={3} className="py-3 px-6 text-right font-black text-slate-800">Total</td>
                <td className="py-3 px-6 text-right font-black text-slate-800">{formatQAR(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PAYMENTS CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>💰</span> Payments
          </h2>
          <div className="text-sm font-bold text-slate-700">
            {formatQAR(invoice.amountPaid || 0)} <span className="text-slate-400 font-medium">of</span> {formatQAR(invoice.totalAmount)}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {invoice.payments?.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Method</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 text-slate-600">{formatDateTime(p.receivedAt)}</td>
                      <td className="py-2 pr-4 text-slate-600">{p.method || '--'}</td>
                      <td className="py-2 text-right font-bold text-slate-800">{formatQAR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-400 text-sm italic">No payments recorded yet.</p>
            )}
          </div>

          {invoice.cancelledAt ? (
            <p className="text-slate-400 text-sm italic">This invoice is cancelled — payments cannot be recorded.</p>
          ) : (
          <form onSubmit={handleRecordPayment} className="space-y-3">
            {paymentError && (
              <p className="text-rose-600 text-sm font-semibold">{paymentError}</p>
            )}
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-black"
              />
              <input
                type="text"
                placeholder="Method (optional)"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-black"
              />
            </div>
            <select
              value={paymentJournalId}
              onChange={(e) => setPaymentJournalId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-black bg-white"
            >
              <option value="">Journal: default (Cash)</option>
              {journals.map((j: any) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={isRecordingPayment}
              className="bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-50"
            >
              {isRecordingPayment ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
          )}
        </div>
      </div>

    </div>
  );
}
