'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const BUCKET_LABELS: Record<string, string> = { current: '0-30 days', '31-60': '31-60 days', '61-90': '61-90 days', '90+': '90+ days' };
const BUCKET_COLORS: Record<string, string> = {
  current: 'bg-purple-50 text-purple-700',
  '31-60': 'bg-amber-50 text-amber-700',
  '61-90': 'bg-orange-50 text-orange-700',
  '90+': 'bg-rose-50 text-rose-700',
};

export default function ApAgingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOf, setAsOf] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf]);

  const fetchData = async () => {
    setLoading(true);
    const token = getClientToken();
    const params = asOf ? `?asOf=${asOf}` : '';
    const res = await fetch(`${API_BASE_URL}/accounting/reports/ap-aging${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = data.rows.map((r: any) => ({
      'Invoice #': r.invoiceNumber,
      'Supplier': r.supplierName,
      'Invoice Date': formatDate(r.invoiceDate),
      'Due Date': formatDate(r.dueDate),
      'Total': r.totalAmount,
      'Paid': r.amountPaid,
      'Outstanding': r.outstanding,
      'Days Overdue': r.daysOverdue,
      'Bucket': BUCKET_LABELS[r.bucket],
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AP Aging');
    XLSX.writeFile(workbook, `AP_Aging.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Accounts Payable Aging</h1>
          <p className="text-sm text-gray-500 mt-1">Which suppliers we owe money to, and how overdue.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          <button onClick={exportCsv} disabled={!data || data.rows.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:bg-gray-300">
            📊 Export
          </button>
          <Link href={`/dashboard/accounting/reports/ap-aging/print${asOf ? `?asOf=${asOf}` : ''}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap">
            🖨️ Print
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(['current', '31-60', '61-90', '90+'] as const).map((bucket) => (
              <div key={bucket} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">{BUCKET_LABELS[bucket]}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{formatQAR(data?.totals?.[bucket] || 0)}</p>
              </div>
            ))}
            <div className="bg-slate-900 p-4 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-300 uppercase">Total Outstanding</p>
              <p className="text-xl font-bold text-white mt-1">{formatQAR(data?.totals?.total || 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {!data || data.rows.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No outstanding payables.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Outstanding</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-black">
                  {data.rows.map((r: any) => (
                    <tr key={r.purchaseOrderId} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <Link href={`/dashboard/purchases/${r.purchaseOrderId}`} className="font-bold text-purple-700 font-mono hover:underline">{r.invoiceNumber}</Link>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold">{r.supplierName}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{formatDate(r.invoiceDate)}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{formatDate(r.dueDate)}</td>
                      <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(r.outstanding)}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${BUCKET_COLORS[r.bucket]}`}>
                          {r.daysOverdue}d — {BUCKET_LABELS[r.bucket]}
                        </span>
                      </td>
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
