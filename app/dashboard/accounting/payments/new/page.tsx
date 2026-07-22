'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function RegisterPaymentPage() {
  const router = useRouter();
  const [partyType, setPartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [partyName, setPartyName] = useState('');
  const [openDocs, setOpenDocs] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [method, setMethod] = useState('');
  const [journalId, setJournalId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSuppliers = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSuppliers(await res.json());
    };
    const loadCustomers = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    };
    const loadJournals = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/journals?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setJournals(await res.json());
    };
    loadSuppliers();
    loadCustomers();
    loadJournals();
  }, []);

  const loadOpenDocs = async (name: string) => {
    if (!name.trim()) {
      setOpenDocs([]);
      return;
    }
    setIsLoadingDocs(true);
    const token = getClientToken();
    const endpoint = partyType === 'CUSTOMER'
      ? `/accounting/payments/open/invoices?customerName=${encodeURIComponent(name)}`
      : `/accounting/payments/open/bills?supplierName=${encodeURIComponent(name)}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      setOpenDocs(await res.json());
      setAllocations({});
    }
    setIsLoadingDocs(false);
  };

  const handlePartyTypeChange = (type: 'CUSTOMER' | 'SUPPLIER') => {
    setPartyType(type);
    setPartyName('');
    setOpenDocs([]);
    setAllocations({});
  };

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSubmit = async () => {
    const nonZero = Object.entries(allocations).filter(([, v]) => Number(v) > 0);
    if (nonZero.length === 0) {
      setError('Allocate an amount to at least one document.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        partyType,
        partyName,
        amount: totalAllocated,
        method: method || undefined,
        journalId: journalId ? Number(journalId) : undefined,
        notes: notes || undefined,
        allocations: nonZero.map(([docId, amt]) => {
          const doc = openDocs.find((d) => d.id === Number(docId));
          return {
            sourceType: partyType === 'CUSTOMER' ? 'SALES_INVOICE' : 'PURCHASE_INVOICE',
            sourceId: Number(docId),
            amountAllocated: Number(amt),
          };
        }),
      }),
    });
    if (res.ok) {
      router.push('/dashboard/accounting/payments');
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.message || 'Failed to record payment.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/accounting/payments" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to Payments
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Register Payment</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Party Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePartyTypeChange('CUSTOMER')}
              className={`px-4 py-2 rounded-md text-sm font-bold ${partyType === 'CUSTOMER' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Customer (receive money)
            </button>
            <button
              type="button"
              onClick={() => handlePartyTypeChange('SUPPLIER')}
              className={`px-4 py-2 rounded-md text-sm font-bold ${partyType === 'SUPPLIER' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Supplier (pay money)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'}</label>
          {partyType === 'CUSTOMER' ? (
            <select
              value={partyName}
              onChange={(e) => { setPartyName(e.target.value); loadOpenDocs(e.target.value); }}
              className="w-full border border-gray-300 rounded-md p-3 text-black bg-white"
            >
              <option value="">Select customer...</option>
              {customers.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          ) : (
            <select
              value={partyName}
              onChange={(e) => { setPartyName(e.target.value); loadOpenDocs(e.target.value); }}
              className="w-full border border-gray-300 rounded-md p-3 text-black bg-white"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {isLoadingDocs && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">Loading open documents...</div>}

      {!isLoadingDocs && openDocs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-800">Open {partyType === 'CUSTOMER' ? 'Invoices' : 'Bills'}</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6 text-right">Total</th>
                <th className="py-3 px-6 text-right">Paid</th>
                <th className="py-3 px-6 text-right">Outstanding</th>
                <th className="py-3 px-6 text-right w-40">Allocate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {openDocs.map((doc: any) => {
                const outstanding = doc.totalAmount - doc.amountPaid;
                return (
                  <tr key={doc.id}>
                    <td className="py-3 px-6 font-mono font-bold text-sm">{doc.invoiceNumber || doc.billNumber}</td>
                    <td className="py-3 px-6 text-right text-sm">{formatQAR(doc.totalAmount)}</td>
                    <td className="py-3 px-6 text-right text-sm text-gray-500">{formatQAR(doc.amountPaid)}</td>
                    <td className="py-3 px-6 text-right text-sm font-bold">{formatQAR(outstanding)}</td>
                    <td className="py-3 px-6 text-right">
                      <input
                        type="number"
                        min="0"
                        max={outstanding}
                        step="0.01"
                        value={allocations[doc.id] || ''}
                        onChange={(e) => setAllocations({ ...allocations, [doc.id]: e.target.value })}
                        className="w-32 border border-gray-300 rounded p-2 text-right text-sm"
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoadingDocs && partyName && openDocs.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          No open {partyType === 'CUSTOMER' ? 'invoices' : 'bills'} found for &quot;{partyName}&quot;.
        </div>
      )}

      {openDocs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Journal</label>
              <select
                value={journalId}
                onChange={(e) => setJournalId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 text-black bg-white"
              >
                <option value="">Default (Cash)</option>
                {journals.map((j: any) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
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
              <p className="text-xs text-gray-500 uppercase font-bold">Total to {partyType === 'CUSTOMER' ? 'receive' : 'pay'}</p>
              <p className="text-2xl font-bold text-teal-700">{formatQAR(totalAllocated)}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || totalAllocated <= 0}
              className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-md transition disabled:bg-gray-400"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
        </div>
      )}
    </div>
  );
}
