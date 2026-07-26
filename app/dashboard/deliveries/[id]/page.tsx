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

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Delivery...</div>;
  if (!delivery) return <div className="p-8 text-center text-rose-500 font-bold">Delivery not found.</div>;

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

    </div>
  );
}
