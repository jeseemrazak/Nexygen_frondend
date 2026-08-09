'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const [catRes, accRes] = await Promise.all([
      fetch(`${API_BASE_URL}/expense-categories`, { headers }),
      fetch(`${API_BASE_URL}/accounting/accounts?activeOnly=true`, { headers }),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (accRes.ok) setAccounts((await accRes.json()).filter((a: any) => a.type === 'EXPENSE'));
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountId) return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expense-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), accountId: Number(accountId) }),
    });
    if (res.ok) {
      setName('');
      setAccountId('');
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create category.');
    }
    setIsSubmitting(false);
  };

  const toggleActive = async (cat: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expense-categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update category.');
    }
    fetchAll();
  };

  const remove = async (cat: any) => {
    if (!confirm(`Delete category "${cat.name}"? Only works if no expenses reference it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expense-categories/${cat.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expense Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Each category posts to its own Expense GL account when approved.</p>
        </div>
        <Link href="/dashboard/expenses" className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
          ← Back to Expenses
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Category</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fuel, Rent, Utilities"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-56"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GL Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white w-64"
            >
              <option value="">Select account...</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No expense categories yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">GL Account</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {categories.map((cat: any) => (
                <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold">{cat.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{cat.account.code} - {cat.account.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${cat.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleActive(cat)} className="text-amber-600 hover:text-amber-800 font-semibold text-sm">
                        {cat.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(cat)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
                        Delete
                      </button>
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
