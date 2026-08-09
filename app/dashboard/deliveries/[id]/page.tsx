'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, uploadUrl } from '@/lib/config';

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

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SHIPPED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function DeliveryDetailsPage() {
  const params = useParams();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState('');

  useEffect(() => {
    fetchDelivery();
  }, []);

  const fetchDelivery = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/deliveries/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setDelivery(await res.json());
    } catch (error) {
      console.error('Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setError('');
    setIsUpdating(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/deliveries/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchDelivery();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to update delivery status.');
      }
    } catch (error) {
      setError('Network error while updating delivery status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const alreadyReturned = (deliveryItemId: number) =>
    (delivery?.returns || []).reduce((sum: number, r: any) =>
      sum + r.items.filter((i: any) => i.deliveryItemId === deliveryItemId).reduce((s: number, i: any) => s + i.quantity, 0), 0);

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');

    const items = delivery.items
      .filter((item: any) => Number(returnQty[item.id]) > 0)
      .map((item: any) => ({ deliveryItemId: item.id, quantity: Number(returnQty[item.id]) }));

    if (items.length === 0) {
      setReturnError('Enter a quantity for at least one item.');
      return;
    }

    setIsReturning(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/deliveries/${delivery.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: returnReason || undefined, items }),
      });
      if (res.ok) {
        setReturnQty({});
        setReturnReason('');
        await fetchDelivery();
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

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Delivery...</div>;
  if (!delivery) return <div className="p-8 text-center text-rose-500 font-bold">Delivery not found.</div>;

  const returnableItems = delivery.items.filter((item: any) => alreadyReturned(item.id) < item.quantity);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href={`/dashboard/orders/${delivery.salesOrderId}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Sales Order #{delivery.salesOrderId.toString().padStart(4, '0')}
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            Delivery #{delivery.id.toString().padStart(4, '0')}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${statusBadge[delivery.status]}`}>
              {delivery.status}
            </span>
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">📅</span> {formatDateTime(delivery.createdAt)}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏭</span> {delivery.salesOrder?.warehouse?.name || 'Unknown Warehouse'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏢</span> Client: <span className="font-bold text-slate-800">{delivery.salesOrder?.clientName || 'Walk-in'}</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">👤</span> {delivery.salesOrder?.user?.name || 'Unassigned'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link
              href={`/dashboard/deliveries/${delivery.id}/print`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all"
            >
              🖨️ Print
            </Link>
            {delivery.status === 'PENDING' && (
              <button
                onClick={() => updateStatus('SHIPPED')}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all disabled:bg-gray-400"
              >
                🚚 Mark as Shipped
              </button>
            )}
            {delivery.status === 'SHIPPED' && (
              <button
                onClick={() => updateStatus('DELIVERED')}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all disabled:bg-gray-400"
              >
                ✅ Mark as Delivered
              </button>
            )}
          </div>
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
        </div>
      </div>

      {/* PROOF OF DELIVERY */}
      {delivery.proofOfDelivery && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5 mb-4">
            <span>📸</span> Proof of Delivery
          </h2>
          <a href={uploadUrl(delivery.proofOfDelivery)} target="_blank" rel="noopener noreferrer">
            <img
              src={uploadUrl(delivery.proofOfDelivery)}
              alt="Proof of delivery"
              className="max-h-96 rounded-lg border border-slate-200 shadow-sm"
            />
          </a>
        </div>
      )}

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
                <th className="py-4 px-6">Box Barcode</th>
                <th className="py-4 px-6">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {delivery.items.map((item: any) => (
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
                    <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                      {item.boxBarcode || 'Not Assigned'}
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

      {/* RETURN ITEMS */}
      {returnableItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>↩️</span> Return Items
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
                    <th className="py-2 pr-4 text-center">Delivered</th>
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
      {delivery.returns?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>📜</span> Return History
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {delivery.returns.map((ret: any) => (
              <div key={ret.id} className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-slate-700">{formatDateTime(ret.createdAt)}</p>
                  {ret.reason && <p className="text-sm text-slate-500 italic">{ret.reason}</p>}
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  {ret.items.map((i: any) => {
                    const original = delivery.items.find((di: any) => di.id === i.deliveryItemId);
                    return (
                      <li key={i.id}>
                        <span className="font-bold text-slate-800">{i.quantity}</span> × {original?.product?.name || `Item #${i.deliveryItemId}`}
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
