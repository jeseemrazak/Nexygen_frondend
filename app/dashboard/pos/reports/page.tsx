'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function PosReportsPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filters, setFilters] = useState({ from: '', to: '', warehouseId: '' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWarehouses = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/warehouses`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setWarehouses(await res.json());
    };
    loadWarehouses();
  }, []);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    const token = getClientToken();
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
    const res = await fetch(`${API_BASE_URL}/pos-sales/report?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">POS Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Z-report style summary of takings by payment method. Cancelled sales are excluded.</p>
        </div>
        <Link
          href={`/dashboard/pos/reports/print?${new URLSearchParams({ ...(filters.from && { from: filters.from }), ...(filters.to && { to: filters.to }), ...(filters.warehouseId && { warehouseId: filters.warehouseId }) }).toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all whitespace-nowrap"
        >
          🖨️ Print
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warehouse</label>
            <select value={filters.warehouseId} onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
              <option value="">All warehouses</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => setFilters({ from: '', to: '', warehouseId: '' })}
            className="text-gray-500 text-sm font-bold hover:underline pb-2"
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Transactions</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{data?.transactionCount ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Total Discount Given</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{formatQAR(data?.totalDiscount ?? 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Cancelled Sales</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{data?.cancelledCount ?? 0}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-300 uppercase">Total Takings</p>
              <p className="text-xl font-bold text-white mt-1">{formatQAR(data?.totalSales ?? 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">By Payment Method</h2>
            </div>
            {!data || data.byPaymentMethod.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No sales in this range.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Method</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Transactions</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-black">
                  {data.byPaymentMethod.map((m: any) => (
                    <tr key={m.paymentMethodId}>
                      <td className="py-3 px-6 font-bold text-sm">{m.name}</td>
                      <td className="py-3 px-6 text-right text-sm">{m.count}</td>
                      <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">By Product</h2>
            </div>
            {!data || data.byProduct.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No sales in this range.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Qty Sold</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-black">
                  {data.byProduct.map((p: any) => (
                    <tr key={p.productId}>
                      <td className="py-3 px-6 font-bold text-sm">{p.name}</td>
                      <td className="py-3 px-6 text-right text-sm">{p.quantity}</td>
                      <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
