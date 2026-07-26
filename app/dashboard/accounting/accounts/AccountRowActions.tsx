'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

export default function AccountRowActions({ account }: { account: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState(account.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const patch = async (body: any) => {
    setError('');
    setIsSubmitting(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setIsSubmitting(false);
    if (res.ok) {
      setIsEditing(false);
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Update failed.');
    }
    return res.ok;
  };

  const handleDelete = async () => {
    if (!confirm(`Delete account ${account.code} - ${account.name}? This only works if it has no posted journal history.`)) return;
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/accounts/${account.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Delete failed.');
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm text-black w-40"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm text-black bg-white">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
            className="text-gray-500 text-xs font-bold hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={() => patch({ name, type })}
            disabled={isSubmitting}
            className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && <p className="text-rose-600 text-xs font-semibold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-3 items-center">
        <button onClick={() => setIsEditing(true)} className="text-teal-600 hover:text-teal-800 font-semibold text-sm">
          Edit
        </button>
        <button
          onClick={() => patch({ isActive: !account.isActive })}
          disabled={isSubmitting}
          className={`font-semibold text-sm ${account.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`}
        >
          {account.isActive ? 'Deactivate' : 'Activate'}
        </button>
        {!account.isSystemAccount && (
          <button onClick={handleDelete} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
            Delete
          </button>
        )}
      </div>
      {error && <p className="text-rose-600 text-xs font-semibold">{error}</p>}
    </div>
  );
}
