'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function MerchandisersPage() {
  const [merchandisers, setMerchandisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add-new form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Edit-in-place form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchMerchandisers();
  }, []);

  const fetchMerchandisers = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/users/merchandisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMerchandisers(data);
      }
    } catch (error) {
      console.error('Failed to fetch roster');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    const token = getClientToken();

    try {
      const res = await fetch(`${API_BASE_URL}/users/merchandiser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setMessage({ text: 'Merchandiser added successfully! 🎉', type: 'success' });
        setName('');
        setEmail('');
        setPassword('');
        fetchMerchandisers();
      } else {
        const errData = await safeJson(res);
        setMessage({ text: errData?.message || 'Failed to create user.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Network error. Make sure backend is running.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setEditName(m.name || '');
    setEditEmail(m.email || '');
    setEditPassword('');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const saveEdit = async (id: number) => {
    setEditSaving(true);
    setEditError('');

    const token = getClientToken();
    const body: Record<string, string> = { name: editName, email: editEmail };
    if (editPassword) body.password = editPassword;

    try {
      const res = await fetch(`${API_BASE_URL}/users/merchandiser/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditingId(null);
        fetchMerchandisers();
      } else {
        const errData = await safeJson(res);
        setEditError(errData?.message || 'Failed to save changes.');
      }
    } catch (error) {
      setEditError('Network error. Make sure backend is running.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Manage Merchandizer</h1>
        <p className="text-gray-500 mt-1">Add, edit, and view your active delivery roster.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: ADD FORM (Takes 1/3 space) */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 h-fit overflow-hidden">
          <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
            <h2 className="text-lg font-bold text-purple-800 flex items-center gap-2">
              ➕ Add Merchandiser
            </h2>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-4">

            {message.text && (
              <div className={`p-3 rounded text-sm font-bold border ${message.type === 'success' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-black focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-black focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Temporary Password</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-black focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                placeholder="Assign a secure password"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md shadow-sm transition mt-4 flex justify-center"
            >
              {saving ? 'Creating User...' : 'Create Merchandiser'}
            </button>
          </form>
        </div>

        {/* RIGHT: ROSTER LIST (Takes 2/3 space) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              👥 Active Roster
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
              {merchandisers.length} Total
            </span>
          </div>

          <div className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500 font-bold">Loading roster...</div>
            ) : merchandisers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">No merchandisers added yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 border-b border-gray-200 z-10 shadow-sm">
                  <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Date Added</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {merchandisers.map((m) =>
                    editingId === m.id ? (
                      <tr key={m.id} className="bg-purple-50/40">
                        <td colSpan={5} className="py-4 px-6">
                          {editError && (
                            <div className="mb-3 p-2 rounded text-xs font-bold text-red-700 bg-red-50 border border-red-200">
                              {editError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                              <input
                                type="text"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={cancelEdit}
                              disabled={editSaving}
                              className="px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100 text-sm disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(m.id)}
                              disabled={editSaving}
                              className="px-5 py-2 rounded-md font-bold text-white bg-purple-600 hover:bg-purple-700 text-sm disabled:bg-gray-400"
                            >
                              {editSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-gray-400">#{m.id}</td>
                        <td className="py-4 px-6 font-bold text-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                              {m.name.charAt(0)}
                            </div>
                            {m.name}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{m.email}</td>
                        <td className="py-4 px-6 text-gray-500 text-xs">
                          {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => startEdit(m)}
                            className="text-purple-600 hover:text-purple-800 font-bold text-xs underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
