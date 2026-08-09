'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

// Helper to format dates beautifully
function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products/movements`, {
      headers: { 'Authorization': `Bearer ${getClientToken()}` },
    })
      .then(res => res.json())
      .then(data => setMovements(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>📋</span> Stock Movement Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track every transfer, write-off, and adjustment across your network.</p>
        </div>
        <Link 
          href="/dashboard/inventory/transfer" 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg transition-all"
        >
          New Stock Operation
        </Link>
      </div>

      {/* AUDIT TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading audit logs...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No stock movements recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Product & Batch</th>
                  <th className="py-4 px-6 text-center">Operation</th>
                  <th className="py-4 px-6 text-center">Qty</th>
                  <th className="py-4 px-6">Routing</th>
                  <th className="py-4 px-6">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {movements.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Date */}
                    <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* Product */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{log.product?.name || 'Unknown'}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">Batch: {log.batchNumber}</p>
                    </td>

                    {/* Operation Type (Color Coded) */}
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                        log.type === 'TRANSFER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        log.type === 'WRITE_OFF' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {log.type}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-6 text-center font-black text-slate-700">
                      {log.quantity}
                    </td>

                    {/* Routing (From -> To) */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {log.type === 'TRANSFER' && (
                        <span className="text-slate-600 font-medium text-xs flex items-center gap-2">
                          WH-{log.fromWarehouseId} <span className="text-slate-300">➡️</span> WH-{log.toWarehouseId}
                        </span>
                      )}
                      {log.type === 'WRITE_OFF' && (
                        <span className="text-rose-600 font-medium text-xs">Removed from WH-{log.fromWarehouseId}</span>
                      )}
                      {log.type === 'ADJUSTMENT' && (
                        <span className="text-purple-600 font-medium text-xs">Added to WH-{log.toWarehouseId}</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-4 px-6 text-slate-500 italic text-xs max-w-[200px] truncate">
                      {log.reason || '--'}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}