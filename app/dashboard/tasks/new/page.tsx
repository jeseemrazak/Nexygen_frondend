'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function NewTaskPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');

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
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description: description || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          priority, assignedToId: assignedToId ? Number(assignedToId) : undefined,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        router.push(`/dashboard/tasks/${task.id}`);
      } else {
        const errData = await safeJson(res);
        setError(errData?.message || 'Failed to create task.');
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
        <Link href="/dashboard/tasks" className="text-teal-600 hover:text-teal-800 text-sm font-bold mb-2 inline-block">← Back to Task Board</Link>
        <h1 className="text-2xl font-bold text-gray-800">New Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Assign To</label>
          <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>

        <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
