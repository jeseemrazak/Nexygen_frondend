'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function FiscalYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/fiscal-years`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setYears(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/fiscal-years`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), startDate, endDate }),
    });
    if (res.ok) {
      setName('');
      setStartDate('');
      setEndDate('');
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create fiscal year.');
    }
    setIsSubmitting(false);
  };

  const toggleLock = async (fy: any) => {
    const action = fy.status === 'LOCKED' ? 'unlock' : 'lock';
    if (action === 'lock' && !confirm(`Lock "${fy.name}"? No new journal entries can be posted within this date range while locked.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/fiscal-years/${fy.id}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || `Failed to ${action} fiscal year.`);
    }
  };

  const remove = async (fy: any) => {
    if (!confirm(`Delete fiscal year "${fy.name}"?`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/fiscal-years/${fy.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete fiscal year.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Fiscal Years</h1>
        <p className="text-sm text-gray-500 mt-1">Locking a fiscal year blocks any journal entry (manual or auto-posted) from being posted or voided within its date range.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Fiscal Year</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FY 2026"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Fiscal Year'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : years.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No fiscal years yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Start</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">End</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {years.map((fy: any) => (
                <tr key={fy.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold">{fy.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{new Date(fy.startDate).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{new Date(fy.endDate).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${fy.status === 'LOCKED' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'}`}>
                      {fy.status === 'LOCKED' ? 'Locked' : 'Open'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleLock(fy)} className="text-amber-600 hover:text-amber-800 font-semibold text-sm">
                        {fy.status === 'LOCKED' ? 'Unlock' : 'Lock'}
                      </button>
                      {fy.status !== 'LOCKED' && (
                        <button onClick={() => remove(fy)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
                          Delete
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
