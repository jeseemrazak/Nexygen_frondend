'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const [catRes, ccRes] = await Promise.all([
        fetch(`${API_BASE_URL}/expense-categories?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/accounting/cost-centers?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (ccRes.ok) setCostCenters(await ccRes.json());
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !payeeName.trim() || !amount || Number(amount) <= 0) {
      setError('Fill in category, payee, and a valid amount.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        categoryId: Number(categoryId),
        payeeName: payeeName.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        costCenterId: costCenterId ? Number(costCenterId) : undefined,
      }),
    });
    if (res.ok) {
      router.push('/dashboard/expenses');
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.message || 'Failed to create expense.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/expenses" className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 mb-3">
          ← Back to Expenses
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">New Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 text-black bg-white"
          >
            <option value="">Select category...</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              No categories yet — <Link href="/dashboard/expenses/categories" className="underline font-bold">add one first</Link>.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Payee *</label>
          <input
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="e.g. City Fuel Station"
            className="w-full border border-gray-300 rounded-md p-3 text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes"
            className="w-full border border-gray-300 rounded-md p-3 text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Amount (QAR) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cost Center</label>
          <select
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 text-black bg-white"
          >
            <option value="">-- None --</option>
            {costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>

        {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-md transition disabled:bg-gray-400"
        >
          {isSubmitting ? 'Creating...' : 'Create Expense (Draft)'}
        </button>
      </form>
    </div>
  );
}
