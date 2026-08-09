'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/taxes`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setTaxes(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rate === '') return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), rate: Number(rate), isDefault }),
    });
    if (res.ok) {
      setName('');
      setRate('');
      setIsDefault(false);
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create tax.');
    }
    setIsSubmitting(false);
  };

  const setDefault = async (tax: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/taxes/${tax.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) fetchAll();
  };

  const toggleActive = async (tax: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/taxes/${tax.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !tax.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update tax.');
    }
    fetchAll();
  };

  const remove = async (tax: any) => {
    if (!confirm(`Delete tax "${tax.name}"? Only works if no document references it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/taxes/${tax.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete tax.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Taxes</h1>
          <p className="text-sm text-gray-500 mt-1">Flat-rate taxes selectable on POS sales, sales orders/invoices, and purchase orders/bills. Applied on top of the discounted subtotal.</p>
        </div>
        <Link href="/dashboard/settings/account-mappings" className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
          Account Mappings →
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Tax</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VAT 5%"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
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
            {isSubmitting ? 'Adding...' : 'Add Tax'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : taxes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No taxes yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Rate</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Default</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {taxes.map((t: any) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${!t.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold">{t.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{t.rate}%</td>
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
