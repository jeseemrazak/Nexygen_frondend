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

function formatDateOnly(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function ReceiptDetailsPage() {
  const params = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState('');

  useEffect(() => {
    fetchReceipt();
  }, []);

  const fetchReceipt = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/receipts/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setReceipt(await res.json());
    } catch (error) {
      console.error('Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const alreadyReturned = (receiptItemId: number) =>
    (receipt?.returns || []).reduce((sum: number, r: any) =>
      sum + r.items.filter((i: any) => i.receiptItemId === receiptItemId).reduce((s: number, i: any) => s + i.quantity, 0), 0);

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');

    const items = receipt.items
      .filter((item: any) => Number(returnQty[item.id]) > 0)
      .map((item: any) => ({ receiptItemId: item.id, quantity: Number(returnQty[item.id]) }));

    if (items.length === 0) {
      setReturnError('Enter a quantity for at least one item.');
      return;
    }

    setIsReturning(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/receipts/${receipt.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: returnReason || undefined, items }),
      });
      if (res.ok) {
        setReturnQty({});
        setReturnReason('');
        await fetchReceipt();
      } else {
        const errData = await res.json();
        setReturnError(errData.message || 'Failed to process return.');
      }
    } catch (error) {
      setReturnError('Network error while processing return.');
    } finally {
      setIsReturning(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Receipt...</div>;
  if (!receipt) return <div className="p-8 text-center text-rose-500 font-bold">Receipt not found.</div>;

  const returnableItems = receipt.items.filter((item: any) => alreadyReturned(item.id) < item.quantity);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href={`/dashboard/purchases/${receipt.purchaseOrderId}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Purchase Order #{receipt.purchaseOrderId.toString().padStart(4, '0')}
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            {receipt.receiptNumber || `Receipt #${receipt.id}`}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">📅</span> {formatDateTime(receipt.createdAt)}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏭</span> {receipt.purchaseOrder?.warehouse?.name || 'Unknown Warehouse'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏢</span> Supplier: <span className="font-bold text-slate-800">{receipt.purchaseOrder?.supplier?.name || 'Unknown'}</span>
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/receipts/${receipt.id}/print`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all whitespace-nowrap"
        >
          🖨️ Print
        </Link>
      </div>

      {/* BATCH MANIFEST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Batch Manifest
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Qty</th>
                <th className="py-4 px-6">Batch</th>
                <th className="py-4 px-6">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {receipt.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{item.product.name}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-md">{item.quantity}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                      {item.batchNumber}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-semibold ${item.expiryDate ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                      {item.expiryDate ? formatDateOnly(item.expiryDate) : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RETURN TO SUPPLIER */}
      {returnableItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>↩️</span> Return to Supplier
            </h2>
          </div>
          <form onSubmit={handleReturn} className="p-6 space-y-4">
            {returnError && <p className="text-rose-600 text-sm font-semibold">{returnError}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Batch</th>
                    <th className="py-2 pr-4 text-center">Received</th>
                    <th className="py-2 pr-4 text-center">Already Returned</th>
                    <th className="py-2 text-center">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {returnableItems.map((item: any) => {
                    const returned = alreadyReturned(item.id);
                    const remaining = item.quantity - returned;
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-4 font-bold text-slate-800">{item.product.name}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-600">{item.batchNumber}</td>
                        <td className="py-3 pr-4 text-center">{item.quantity}</td>
                        <td className="py-3 pr-4 text-center">{returned}</td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            placeholder="0"
                            value={returnQty[item.id] || ''}
                            onChange={(e) => setReturnQty({ ...returnQty, [item.id]: e.target.value })}
                            className="w-24 border border-slate-300 rounded-md px-2 py-1.5 text-sm text-black text-center"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-black"
            />
            <button
              type="submit"
              disabled={isReturning}
              className="bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-50"
            >
              {isReturning ? 'Processing...' : 'Process Return'}
            </button>
          </form>
        </div>
      )}

      {/* RETURN HISTORY */}
      {receipt.returns?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>📜</span> Return History
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {receipt.returns.map((ret: any) => (
              <div key={ret.id} className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-slate-700">{formatDateTime(ret.createdAt)}</p>
                  {ret.reason && <p className="text-sm text-slate-500 italic">{ret.reason}</p>}
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  {ret.items.map((i: any) => {
                    const original = receipt.items.find((ri: any) => ri.id === i.receiptItemId);
                    return (
                      <li key={i.id}>
                        <span className="font-bold text-slate-800">{i.quantity}</span> × {original?.product?.name || `Item #${i.receiptItemId}`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
