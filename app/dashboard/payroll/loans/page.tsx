'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-QA', { month: 'short', day: 'numeric', year: 'numeric' });

export default function EmployeeLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [monthlyDeduction, setMonthlyDeduction] = useState('');
  const [issueJournalId, setIssueJournalId] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');

  const [repayAmounts, setRepayAmounts] = useState<Record<number, string>>({});
  const [repayError, setRepayError] = useState('');

  const load = async () => {
    const token = getClientToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const [loansRes, empRes, journalsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/employee-loans`, { headers }),
      fetch(`${API_BASE_URL}/employees?activeOnly=true`, { headers }),
      fetch(`${API_BASE_URL}/accounting/journals?activeOnly=true`, { headers }),
    ]);
    if (loansRes.ok) setLoans(await loansRes.json());
    if (empRes.ok) setEmployees(await empRes.json());
    if (journalsRes.ok) setJournals(await journalsRes.json());
  };

  useEffect(() => { load(); }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError('');
    if (!employeeId || !principalAmount || !monthlyDeduction) {
      setIssueError('Fill in all fields.');
      return;
    }
    setIsIssuing(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/employee-loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        employeeId: Number(employeeId),
        principalAmount: Number(principalAmount),
        monthlyDeduction: Number(monthlyDeduction),
        journalId: issueJournalId ? Number(issueJournalId) : undefined,
      }),
    });
    if (res.ok) {
      setEmployeeId(''); setPrincipalAmount(''); setMonthlyDeduction(''); setIssueJournalId('');
      await load();
    } else {
      const err = await res.json();
      setIssueError(err.message || 'Failed to issue loan.');
    }
    setIsIssuing(false);
  };

  const handleRepay = async (loanId: number) => {
    const amount = repayAmounts[loanId];
    if (!amount || Number(amount) <= 0) return;
    setRepayError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/employee-loans/${loanId}/manual-repayment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    if (res.ok) {
      setRepayAmounts({ ...repayAmounts, [loanId]: '' });
      await load();
    } else {
      const err = await safeJson(res);
      setRepayError(err?.message || `Failed to record repayment (HTTP ${res.status}).`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Employee Loans</h1>
        <p className="text-sm text-gray-500 mt-1">One active loan per employee — the monthly installment is auto-deducted during payroll processing.</p>
      </div>

      <form onSubmit={handleIssue} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="font-bold text-gray-800">Issue Loan</h2>
        {issueError && <p className="text-rose-600 text-sm font-semibold">{issueError}</p>}
        <div className="grid grid-cols-4 gap-3">
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="border border-gray-300 rounded-md p-3 text-black bg-white">
            <option value="">Employee...</option>
            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="number" step="0.01" min="0.01" value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} placeholder="Principal (QAR)" className="border border-gray-300 rounded-md p-3 text-black" />
          <input type="number" step="0.01" min="0.01" value={monthlyDeduction} onChange={(e) => setMonthlyDeduction(e.target.value)} placeholder="Monthly deduction (QAR)" className="border border-gray-300 rounded-md p-3 text-black" />
          <select value={issueJournalId} onChange={(e) => setIssueJournalId(e.target.value)} className="border border-gray-300 rounded-md p-3 text-black bg-white">
            <option value="">Journal: default (Cash)</option>
            {journals.map((j: any) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={isIssuing} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-md shadow-sm disabled:bg-gray-400">
          {isIssuing ? 'Issuing...' : 'Issue Loan'}
        </button>
      </form>

      {repayError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700 font-medium">{repayError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loans.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No loans yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Principal</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Outstanding</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Manual Repayment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {loans.map((l: any) => (
                <tr key={l.id} className={`hover:bg-gray-50 ${l.status === 'CLOSED' ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-mono font-bold text-teal-700">{l.loanNo || `#${l.id}`}</td>
                  <td className="py-4 px-6 text-sm font-bold">{l.employee?.name}</td>
                  <td className="py-4 px-6 text-right text-sm">{formatQAR(l.principalAmount)}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(l.outstandingBalance)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${l.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {l.status === 'ACTIVE' && (
                      <div className="flex justify-end gap-2">
                        <input
                          type="number" step="0.01" min="0.01" max={l.outstandingBalance}
                          value={repayAmounts[l.id] || ''}
                          onChange={(e) => setRepayAmounts({ ...repayAmounts, [l.id]: e.target.value })}
                          placeholder="Amount"
                          className="w-28 border border-gray-300 rounded p-2 text-right text-sm"
                        />
                        <button onClick={() => handleRepay(l.id)} className="text-teal-600 hover:text-teal-800 font-bold text-sm underline">
                          Repay
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
