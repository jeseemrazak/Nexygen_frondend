'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function UnitsOfMeasurementPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/units-of-measurement`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setUnits(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !abbreviation.trim()) return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/units-of-measurement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), abbreviation: abbreviation.trim() }),
    });
    if (res.ok) {
      setName('');
      setAbbreviation('');
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create unit.');
    }
    setIsSubmitting(false);
  };

  const toggleActive = async (unit: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/units-of-measurement/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !unit.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update unit.');
    }
    fetchAll();
  };

  const remove = async (unit: any) => {
    if (!confirm(`Delete unit "${unit.name}"? Only works if no products reference it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/units-of-measurement/${unit.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete unit.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Units of Measurement</h1>
          <p className="text-sm text-gray-500 mt-1">e.g. Pieces, Kilogram, Box, Litre — assignable to any product.</p>
        </div>
        <Link href="/dashboard/configuration" className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
          ← Back to Configuration
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Unit</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kilogram, Piece, Box"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Abbreviation</label>
            <input
              type="text"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="e.g. kg, pcs"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Unit'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : units.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No units of measurement yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Abbreviation</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {units.map((unit: any) => (
                <tr key={unit.id} className={`hover:bg-gray-50 ${!unit.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold">{unit.name}</td>
                  <td className="py-4 px-6 text-sm font-mono">{unit.abbreviation}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${unit.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleActive(unit)} className="text-amber-600 hover:text-amber-800 font-semibold text-sm">
                        {unit.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(unit)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
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
