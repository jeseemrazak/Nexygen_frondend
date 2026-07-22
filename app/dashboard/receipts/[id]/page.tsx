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

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Receipt...</div>;
  if (!receipt) return <div className="p-8 text-center text-rose-500 font-bold">Receipt not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href={`/dashboard/purchases/${receipt.purchaseOrderId}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
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

    </div>
  );
}
