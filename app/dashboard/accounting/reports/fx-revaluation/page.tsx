'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function FxRevaluationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/reports/fx-revaluation`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">FX Revaluation</h1>
          <p className="text-sm text-gray-500 mt-1">Unrealized gain/loss on open foreign-currency Invoices/Bills, comparing the rate frozen at creation to each currency's current rate. Report-only — nothing here posts to the GL.</p>
        </div>
        <Link href="/dashboard/accounting/reports/fx-revaluation/print" target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap">🖨️ Print</Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Unrealized Gain</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatQAR(data?.totalGain || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Unrealized Loss</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{formatQAR(data?.totalLoss || 0)}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-300 uppercase">Net</p>
              <p className={`text-xl font-bold mt-1 ${data && data.netGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatQAR(data?.netGainLoss || 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {!data || data.rows.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No open foreign-currency Invoices or Bills.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Document</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Party</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Currency</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Foreign Outstanding</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Rate (orig → now)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Outstanding (QAR)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Revalued (QAR)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-black">
                  {data.rows.map((r: any) => (
                    <tr key={`${r.type}-${r.documentId}`} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-mono font-bold text-sm">
                        <Link href={r.type === 'AR' ? `/dashboard/sales-invoices/${r.documentId}` : `/dashboard/purchases/${r.documentId}`} className="text-teal-700 hover:underline">
                          {r.documentNumber || `#${r.documentId}`}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.type === 'AR' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{r.type}</span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold">{r.party}</td>
                      <td className="py-4 px-6 text-sm font-mono">{r.currency.symbol ? `${r.currency.symbol} ` : ''}{r.currency.code}</td>
                      <td className="py-4 px-6 text-sm text-right">{r.foreignOutstanding.toFixed(2)}</td>
                      <td className="py-4 px-6 text-sm text-right text-gray-500">{r.originalRate} → {r.currentRate}</td>
                      <td className="py-4 px-6 text-sm text-right">{formatQAR(r.outstandingQAR)}</td>
                      <td className="py-4 px-6 text-sm text-right">{formatQAR(r.revaluedQAR)}</td>
                      <td className={`py-4 px-6 text-sm text-right font-bold ${r.gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatQAR(r.gainLoss)}</td>
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
