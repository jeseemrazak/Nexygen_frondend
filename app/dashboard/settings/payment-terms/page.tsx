'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function PaymentTermsPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [days, setDays] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setTerms(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || days === '') return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), days: Number(days), isDefault }),
    });
    if (res.ok) {
      setName('');
      setDays('');
      setIsDefault(false);
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create payment term.');
    }
    setIsSubmitting(false);
  };

  const setDefault = async (term: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms/${term.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) fetchAll();
  };

  const toggleActive = async (term: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms/${term.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !term.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update payment term.');
    }
    fetchAll();
  };

  const remove = async (term: any) => {
    if (!confirm(`Delete payment term "${term.name}"? Only works if no document references it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms/${term.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete payment term.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Payment Terms</h1>
        <p className="text-sm text-gray-500 mt-1">Net-day terms selectable on Customers/Suppliers and used to compute Invoice/Bill due dates.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Payment Term</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Net 30"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Days</label>
            <input
              type="number"
              min="0"
              step="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-gray-600">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Default
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Term'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payment terms yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Days</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Default</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {terms.map((t: any) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${!t.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold">{t.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{t.days} days</td>
                  <td className="py-4 px-6 text-sm">
                    {t.isDefault ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold uppercase bg-purple-50 text-purple-700">Default</span>
                    ) : (
                      <button onClick={() => setDefault(t)} className="text-slate-500 hover:text-slate-700 font-semibold text-xs underline">
                        Set default
                      </button>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${t.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleActive(t)} className="text-amber-600 hover:text-amber-800 font-semibold text-sm">
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(t)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
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
