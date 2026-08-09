'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function EosGratuityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState('');

  const load = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/payroll/eos-gratuity/report`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePostAccrual = async () => {
    setIsPosting(true);
    setResult('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/payroll/eos-gratuity/post-accrual`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data.posted ? `Posted ${formatQAR(data.totalAmount)} across ${data.employeeCount} employee(s).` : data.message);
      await load();
    } else {
      setResult('Failed to post accrual.');
    }
    setIsPosting(false);
  };

  const totalPending = rows.reduce((s, r) => s + r.pendingIncrement, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">End of Service Gratuity</h1>
          <p className="text-sm text-gray-500 mt-1">Qatar Labour Law No. 14/2004 — non-Qatari employees, vests at 1 year of service.</p>
        </div>
        <button onClick={handlePostAccrual} disabled={isPosting || totalPending <= 0.005} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md shadow-sm disabled:bg-gray-400">
          {isPosting ? 'Posting...' : `Post Accrual (${formatQAR(totalPending)})`}
        </button>
      </div>

      {result && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <p className="text-sm text-blue-800 font-medium">{result}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No non-Qatari payroll-active employees.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Days of Service</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Accrued to Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Already Posted</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {rows.map((r: any) => (
                <tr key={r.employeeId} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-gray-800">{r.name}</td>
                  <td className="py-4 px-6 text-center text-sm">
                    {r.daysOfService < 365 ? <span className="text-amber-600 font-semibold">{r.daysOfService} (not vested)</span> : r.daysOfService}
                  </td>
                  <td className="py-4 px-6 text-right text-sm">{formatQAR(r.accruedToDate)}</td>
                  <td className="py-4 px-6 text-right text-sm text-gray-500">{formatQAR(r.alreadyPosted)}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm text-purple-700">{formatQAR(r.pendingIncrement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
