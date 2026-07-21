'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expenses?status=${statusFilter}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  };

  const runAction = async (id: number, action: 'approve' | 'reject' | 'pay') => {
    setBusyId(id);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expenses/${id}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchExpenses();
    } else {
      const err = await res.json();
      alert(err.message || `Failed to ${action} expense.`);
    }
    setBusyId(null);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this draft expense?')) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) fetchExpenses();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Operating costs — separate from Purchase Bills. Draft → Approved → Paid.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/expenses/categories" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md text-sm transition">
            Categories
          </Link>
          <Link href="/dashboard/expenses/new" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md text-sm transition">
            ➕ New Expense
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          {['ALL', 'DRAFT', 'APPROVED', 'PAID', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition ${statusFilter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No expenses found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Expense #</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Payee</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold text-teal-700 font-mono">{exp.expenseNumber || `#${exp.id}`}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(exp.createdAt)}</td>
                  <td className="py-4 px-6 text-sm">{exp.category.name}</td>
                  <td className="py-4 px-6 text-sm font-bold">{exp.payeeName}</td>
                  <td className="py-4 px-6 text-right font-bold text-sm">{formatQAR(exp.amount)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLE[exp.status]}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {exp.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => runAction(exp.id, 'approve')}
                            disabled={busyId === exp.id}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => runAction(exp.id, 'reject')}
                            disabled={busyId === exp.id}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button onClick={() => remove(exp.id)} className="text-gray-400 hover:text-rose-600 text-xs font-bold">
                            Delete
                          </button>
                        </>
                      )}
                      {exp.status === 'APPROVED' && (
                        <button
                          onClick={() => runAction(exp.id, 'pay')}
                          disabled={busyId === exp.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                        >
                          {busyId === exp.id ? 'Paying...' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
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
