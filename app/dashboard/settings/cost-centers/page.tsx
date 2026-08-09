'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function CostCentersPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setCenters(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), code: code.trim() }),
    });
    if (res.ok) {
      setName('');
      setCode('');
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create cost center.');
    }
    setIsSubmitting(false);
  };

  const toggleActive = async (cc: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers/${cc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !cc.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update cost center.');
    }
    fetchAll();
  };

  const remove = async (cc: any) => {
    if (!confirm(`Delete cost center "${cc.name}"? Only works if no document references it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers/${cc.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete cost center.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Cost Centers</h1>
        <p className="text-sm text-gray-500 mt-1">Reporting dimension you can tag on manual journal lines and expenses — does not affect GL posting logic.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Cost Center</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Doha Branch"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. DOH"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Cost Center'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : centers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cost centers yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {centers.map((c: any) => (
                <tr key={c.id} className={`hover:bg-gray-50 ${!c.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-mono text-sm text-gray-600">{c.code}</td>
                  <td className="py-4 px-6 font-bold">{c.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${c.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleActive(c)} className="text-amber-600 hover:text-amber-800 font-semibold text-sm">
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(c)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
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
