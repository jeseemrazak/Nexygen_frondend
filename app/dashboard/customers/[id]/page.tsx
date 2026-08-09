'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [openSales, setOpenSales] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [savingTerm, setSavingTerm] = useState(false);

  const loadAll = async () => {
    const token = getClientToken();
    const headers = { Authorization: `Bearer ${token}` };
    const customerRes = await fetch(`${API_BASE_URL}/customers/${customerId}`, { headers });
    if (!customerRes.ok) { setLoading(false); return; }
    const customerData = await customerRes.json();
    setCustomer(customerData);

    const [balanceRes, salesRes, historyRes, termsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/accounting/payments/customer-balance/${customerId}`, { headers }),
      fetch(`${API_BASE_URL}/accounting/payments/open-account-sales/${customerId}`, { headers }),
      fetch(`${API_BASE_URL}/accounting/payments`, { headers }),
      fetch(`${API_BASE_URL}/accounting/payment-terms?activeOnly=true`, { headers }),
    ]);
    if (balanceRes.ok) setBalance((await balanceRes.json()).balance);
    if (salesRes.ok) setOpenSales(await salesRes.json());
    if (historyRes.ok) {
      const all = await historyRes.json();
      setHistory(all.filter((p: any) => p.partyType === 'CUSTOMER' && p.partyName === customerData.name));
    }
    if (termsRes.ok) setPaymentTerms(await termsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleTermChange = async (value: string) => {
    setSavingTerm(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentTermId: value ? Number(value) : null }),
    });
    if (res.ok) setCustomer(await res.json());
    setSavingTerm(false);
  };

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSettle = async () => {
    const nonZero = Object.entries(allocations).filter(([, v]) => Number(v) > 0);
    if (nonZero.length === 0) {
      setError('Allocate an amount to at least one sale.');
      return;
    }
    setSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        partyType: 'CUSTOMER',
        partyName: customer.name,
        amount: totalAllocated,
        method: method || undefined,
        notes: notes || undefined,
        allocations: nonZero.map(([saleId, amt]) => ({
          sourceType: 'POS_SALE',
          sourceId: Number(saleId),
          amountAllocated: Number(amt),
        })),
      }),
    });
    if (res.ok) {
      setAllocations({});
      setMethod('');
      setNotes('');
      await loadAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to settle credit.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!customer) return <div className="p-8 text-center text-rose-500 font-bold">Customer not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/customers" className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to Customers
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {customer.contactPerson && <span>{customer.contactPerson} · </span>}
              {customer.phone && <span>{customer.phone} · </span>}
              {customer.email || ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Account Balance</p>
            <p className={`text-2xl font-bold ${balance > 0.01 ? 'text-rose-600' : 'text-purple-600'}`}>{formatQAR(balance)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Payment Term</label>
          <select
            value={customer.paymentTermId || ''}
            onChange={(e) => handleTermChange(e.target.value)}
            disabled={savingTerm}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black"
          >
            <option value="">-- None --</option>
            {paymentTerms.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name} ({t.days} days)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-800">Open Account Sales</h2>
        </div>
        {openSales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No open on-account sales for this customer.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-6">Sale</th>
                <th className="py-3 px-6 text-right">On Account</th>
                <th className="py-3 px-6 text-right">Outstanding</th>
                <th className="py-3 px-6 text-right w-40">Allocate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {openSales.map((sale: any) => (
                <tr key={sale.id}>
                  <td className="py-3 px-6 font-mono font-bold text-sm">{sale.invoiceNumber || `#${sale.id}`}</td>
                  <td className="py-3 px-6 text-right text-sm">{formatQAR(sale.arAmount)}</td>
                  <td className="py-3 px-6 text-right text-sm font-bold">{formatQAR(sale.outstanding)}</td>
                  <td className="py-3 px-6 text-right">
                    <input
                      type="number"
                      min="0"
                      max={sale.outstanding}
                      step="0.01"
                      value={allocations[sale.id] || ''}
                      onChange={(e) => setAllocations({ ...allocations, [sale.id]: e.target.value })}
                      className="w-32 border border-gray-300 rounded p-2 text-right text-sm"
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openSales.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="e.g. Cash, Bank Transfer"
                className="w-full border border-gray-300 rounded-md p-3 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-md p-3 text-black"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total to Settle</p>
              <p className="text-2xl font-bold text-purple-700">{formatQAR(totalAllocated)}</p>
            </div>
            <button
              onClick={handleSettle}
              disabled={submitting || totalAllocated <= 0}
              className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-md transition disabled:bg-gray-400"
            >
              {submitting ? 'Settling...' : 'Settle Credit'}
            </button>
          </div>
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-800">Settlement History</h2>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No settlements recorded yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-6">Payment #</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {history.map((p: any) => (
                <tr key={`${p.source}-${p.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-6 font-mono font-bold text-sm">
                    <Link href={`/dashboard/accounting/payments/${p.id}?source=${p.source}`} className="text-purple-600 hover:text-purple-800 underline">
                      {p.paymentNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-sm text-gray-500">{p.method || <span className="italic text-gray-400">--</span>}</td>
                  <td className="py-3 px-6 text-right text-sm font-bold">{formatQAR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
