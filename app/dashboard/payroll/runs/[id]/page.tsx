'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-QA', { month: 'short', day: 'numeric', year: 'numeric' });

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PROCESSED: 'bg-blue-50 text-blue-700',
  PAID: 'bg-emerald-50 text-emerald-700',
};

export default function PayrollRunDetailPage() {
  const params = useParams();
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [journalId, setJournalId] = useState('');
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState('');
  const [editValues, setEditValues] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchRun();
    fetchJournals();
  }, []);

  const fetchRun = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/runs/${params.id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
      if (res.ok) setRun(await res.json());
    } catch (error) {
      console.error('Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  const fetchJournals = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/journals?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setJournals(await res.json());
  };

  const saveManualInputs = async (payslipId: number) => {
    const values = editValues[payslipId];
    if (!values) return;
    const token = getClientToken();
    await fetch(`${API_BASE_URL}/payroll/payslips/${payslipId}/manual-inputs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(values),
    });
    await fetchRun();
  };

  const handleProcess = async () => {
    setError('');
    setIsActing(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/payroll/runs/${params.id}/process`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchRun();
    } else {
      const err = await res.json();
      setError(err.message || 'Failed to process run.');
    }
    setIsActing(false);
  };

  const handleMarkPaid = async () => {
    setError('');
    setIsActing(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/payroll/runs/${params.id}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ journalId: journalId ? Number(journalId) : undefined }),
    });
    if (res.ok) {
      await fetchRun();
    } else {
      const err = await res.json();
      setError(err.message || 'Failed to mark run as paid.');
    }
    setIsActing(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Run...</div>;
  if (!run) return <div className="p-8 text-center text-rose-500 font-bold">Run not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 font-sans">

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href="/dashboard/payroll/runs" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3">
            ← Back to Runs
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            {run.runNo || `Run #${run.id}`}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${statusBadge[run.status]}`}>{run.status}</span>
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="text-slate-600 font-medium">📅 {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}</p>
            <p className="text-slate-600 font-medium">💰 Gross: <span className="font-bold text-slate-800">{formatQAR(run.totalGross)}</span></p>
            <p className="text-slate-600 font-medium">💵 Net: <span className="font-bold text-slate-800">{formatQAR(run.totalNet)}</span></p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {run.status === 'DRAFT' && (
            <button onClick={handleProcess} disabled={isActing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm disabled:bg-gray-400">
              {isActing ? 'Processing...' : 'Process Run'}
            </button>
          )}
          {run.status === 'PROCESSED' && (
            <div className="flex gap-2 items-center">
              <select value={journalId} onChange={(e) => setJournalId(e.target.value)} className="border border-slate-300 rounded-md p-2 text-sm text-black bg-white">
                <option value="">Journal: default (Cash)</option>
                {journals.map((j: any) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
              <button onClick={handleMarkPaid} disabled={isActing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm disabled:bg-gray-400">
                {isActing ? 'Paying...' : 'Mark as Paid'}
              </button>
            </div>
          )}
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800">📋 Payslips</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 text-right">Basic</th>
                <th className="py-3 px-4 text-right">Allowances</th>
                {run.status === 'DRAFT' && <th className="py-3 px-4 text-center">OT Hrs</th>}
                {run.status === 'DRAFT' && <th className="py-3 px-4 text-center">Unpaid Days</th>}
                {run.status === 'DRAFT' && <th className="py-3 px-4 text-center">Other Ded.</th>}
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">GRSIA</th>
                <th className="py-3 px-4 text-right">Loan</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {run.payslips.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {p.employee.name}
                    {p.isQatari && <span className="ml-1.5 text-[10px] font-bold text-teal-600 uppercase">QA</span>}
                  </td>
                  <td className="py-3 px-4 text-right">{formatQAR(p.basicSalary)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatQAR(p.allowancesTotal)}</td>
                  {run.status === 'DRAFT' && (
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number" min="0" step="0.5" defaultValue={p.overtimeHours}
                        onChange={(e) => setEditValues({ ...editValues, [p.id]: { ...editValues[p.id], overtimeHours: Number(e.target.value) } })}
                        onBlur={() => saveManualInputs(p.id)}
                        className="w-16 border border-slate-300 rounded p-1 text-center"
                      />
                    </td>
                  )}
                  {run.status === 'DRAFT' && (
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number" min="0" step="0.5" defaultValue={p.unpaidLeaveDays}
                        onChange={(e) => setEditValues({ ...editValues, [p.id]: { ...editValues[p.id], unpaidLeaveDays: Number(e.target.value) } })}
                        onBlur={() => saveManualInputs(p.id)}
                        className="w-16 border border-slate-300 rounded p-1 text-center"
                      />
                    </td>
                  )}
                  {run.status === 'DRAFT' && (
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number" min="0" step="0.01" defaultValue={p.otherDeductions}
                        onChange={(e) => setEditValues({ ...editValues, [p.id]: { ...editValues[p.id], otherDeductions: Number(e.target.value) } })}
                        onBlur={() => saveManualInputs(p.id)}
                        className="w-20 border border-slate-300 rounded p-1 text-center"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4 text-right font-bold">{formatQAR(p.grossPay)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{p.isQatari ? formatQAR(p.grsiaEmployeeAmount) : '--'}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{p.loanDeduction > 0 ? formatQAR(p.loanDeduction) : '--'}</td>
                  <td className="py-3 px-4 text-right text-rose-600">{formatQAR(p.totalDeductions)}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">{formatQAR(p.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
