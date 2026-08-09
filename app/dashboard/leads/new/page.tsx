'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function NewLeadPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, contactPerson: contactPerson || undefined, phone: phone || undefined,
          email: email || undefined, address: address || undefined, source: source || undefined,
          assignedToId: assignedToId ? Number(assignedToId) : undefined, notes: notes || undefined,
        }),
      });
      if (res.ok) {
        const lead = await res.json();
        router.push(`/dashboard/leads/${lead.id}`);
      } else {
        const errData = await safeJson(res);
        setError(errData?.message || 'Failed to create lead.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/leads" className="text-teal-600 hover:text-teal-800 text-sm font-bold mb-2 inline-block">← Back to Leads</Link>
        <h1 className="text-2xl font-bold text-gray-800">Add Lead</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Source</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Referral, Website, Cold call" className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Assign To</label>
          <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>

        <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Lead'}
        </button>
      </form>
    </div>
  );
}
