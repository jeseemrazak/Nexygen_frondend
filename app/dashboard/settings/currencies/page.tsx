'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [rate, setRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/currencies`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setCurrencies(await res.json());
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || rate === '') return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/currencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code: code.trim(), name: name.trim(), symbol: symbol.trim() || undefined, exchangeRateToBase: Number(rate) }),
    });
    if (res.ok) {
      setCode('');
      setName('');
      setSymbol('');
      setRate('');
      fetchAll();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create currency.');
    }
    setIsSubmitting(false);
  };

  const updateRate = async (currency: any) => {
    const next = prompt(`New exchange rate for 1 ${currency.code} in QAR:`, String(currency.exchangeRateToBase));
    if (!next || isNaN(Number(next))) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/currencies/${currency.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ exchangeRateToBase: Number(next) }),
    });
    if (res.ok) fetchAll();
    else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update rate.');
    }
  };

  const toggleActive = async (currency: any) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/currencies/${currency.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !currency.isActive }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to update currency.');
    }
    fetchAll();
  };

  const remove = async (currency: any) => {
    if (!confirm(`Delete currency "${currency.code}"? Only works if no document references it.`)) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/currencies/${currency.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await safeJson(res);
      alert(err?.message || 'Failed to delete currency.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Currencies</h1>
        <p className="text-sm text-gray-500 mt-1">Foreign currencies selectable on Invoices/Bills as a quoted equivalent — every amount is still computed and posted in QAR. Rates are QAR per 1 unit of the currency; keep them updated for the FX Revaluation report to be accurate.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Currency</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="w-28">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. USD"
              maxLength={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black font-mono"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. US Dollar"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-20">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="$"
              maxLength={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rate (QAR per 1)</label>
            <input
              type="number"
              min="0.000001"
              step="0.000001"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 3.64"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md text-sm disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Currency'}
          </button>
        </form>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : currencies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No currencies yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Rate (QAR)</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {currencies.map((c: any) => (
                <tr key={c.id} className={`hover:bg-gray-50 ${!c.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-mono font-bold">{c.symbol ? `${c.symbol} ` : ''}{c.code}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{c.name}</td>
                  <td className="py-4 px-6 text-sm text-right">{c.exchangeRateToBase}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${c.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => updateRate(c)} className="text-slate-500 hover:text-slate-700 font-semibold text-xs underline">
                        Update rate
                      </button>
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
