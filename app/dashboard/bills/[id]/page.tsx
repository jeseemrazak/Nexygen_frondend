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

export default function BillDetailsPage() {
  const params = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentJournalId, setPaymentJournalId] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchBillDetails();
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

  const fetchBillDetails = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setBill(await res.json());
    } catch (error) {
      console.error('Failed to load bill');
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
      const res = await fetch(`${API_BASE_URL}/bills/${bill.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, method: paymentMethod || undefined, journalId: paymentJournalId ? Number(paymentJournalId) : undefined }),
      });

      if (res.ok) {
        setPaymentAmount('');
        setPaymentMethod('');
        setPaymentJournalId('');
        await fetchBillDetails();
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
    if (!bill || !confirm('Cancel this bill? This will reverse its accounting entries and cannot be undone.')) return;
    setIsCancelling(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${bill.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchBillDetails();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to cancel bill.');
      }
    } catch (error) {
      alert('Network error while cancelling bill.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Bill...</div>;
  if (!bill) return <div className="p-8 text-center text-rose-500 font-bold">Bill not found.</div>;

  const canCancel = !bill.cancelledAt && !(bill.amountPaid > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/dashboard/purchases/invoices" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
          ← Back to Purchase Invoices
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
          {bill.billNumber || `Bill #${bill.id}`}
          {bill.cancelledAt ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset bg-slate-100 text-slate-600 ring-slate-300">
              CANCELLED
            </span>
          ) : (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${
              bill.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
              bill.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
              'bg-rose-50 text-rose-700 ring-rose-600/20'
            }`}>
              {bill.paymentStatus || 'UNPAID'}
            </span>
          )}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">📅</span> {formatDateTime(bill.createdAt)}
          </p>
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">🏢</span> Supplier: <span className="font-bold text-slate-800">{bill.purchaseOrder?.supplier?.name || 'Unknown'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">📦</span> <Link href={`/dashboard/purchases/${bill.purchaseOrderId}`} className="text-teal-600 hover:underline font-bold">View Purchase Order #{bill.purchaseOrderId}</Link>
          </p>
          <Link
            href={`/dashboard/bills/${bill.id}/print`}
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
              {isCancelling ? 'Cancelling...' : '✕ Cancel Bill'}
            </button>
          )}
        </div>
      </div>

      {/* MANIFEST (READ ONLY) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Bill Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Qty</th>
                <th className="py-4 px-6 text-right">Unit Cost</th>
                <th className="py-4 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bill.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{item.product?.name}</td>
                  <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantity}</td>
                  <td className="py-4 px-6 text-right text-slate-600">{formatQAR(item.unitCost)}</td>
                  <td className="py-4 px-6 text-right font-bold">{formatQAR(item.unitCost * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={3} className="py-3 px-6 text-right font-black text-slate-800">Total</td>
                <td className="py-3 px-6 text-right font-black text-slate-800">{formatQAR(bill.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PAYMENTS CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>💰</span> Payments to Supplier
          </h2>
          <div className="text-sm font-bold text-slate-700">
            {formatQAR(bill.amountPaid || 0)} <span className="text-slate-400 font-medium">of</span> {formatQAR(bill.totalAmount)}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {bill.payments?.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Method</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 text-slate-600">{formatDateTime(p.paidAt)}</td>
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

          {bill.cancelledAt ? (
            <p className="text-slate-400 text-sm italic">This bill is cancelled — payments cannot be recorded.</p>
          ) : bill.paymentStatus !== 'PAID' && (
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
