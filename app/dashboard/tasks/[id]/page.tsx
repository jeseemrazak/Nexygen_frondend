'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_LABELS: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_STYLES: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  DONE: 'bg-purple-50 text-purple-700',
};
const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-rose-50 text-rose-700',
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');

  const fetchTask = async () => {
    const token = getClientToken();
    const [taskRes, usersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/tasks/${params.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (taskRes.ok) {
      const data = await taskRes.json();
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '');
      setPriority(data.priority);
      setAssignedToId(data.assignedToId ? String(data.assignedToId) : '');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTask(); }, []);

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchTask();
    setStatusUpdating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description: description || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          priority, assignedToId: assignedToId ? Number(assignedToId) : null,
        }),
      });
      if (res.ok) { await fetchTask(); setEditing(false); }
      else { const e = await safeJson(res); setError(e?.message || 'Failed to save.'); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) router.push('/dashboard/tasks');
    else alert('Failed to delete task.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;
  if (!task) return <div className="p-8 text-center text-rose-500 font-bold">Task not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/tasks" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">← Back to Task Board</Link>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 flex-wrap">
              {task.title}
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[task.status]}`}>{STATUS_LABELS[task.status]}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
            </h1>
            {task.dueDate && <p className="text-sm text-gray-500 mt-1">Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm transition">{editing ? 'Cancel' : 'Edit'}</button>
            <button onClick={handleDelete} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-lg border border-rose-200 text-sm transition">Delete</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="font-bold text-gray-800">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating || s === task.status}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition disabled:cursor-default ${
                s === task.status ? `${STATUS_STYLES[s]} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
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
          <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
            <h2 className="font-bold text-gray-800 mb-2">Details</h2>
            <p className="text-sm text-gray-600"><span className="text-gray-400">Assigned To:</span> {task.assignedTo?.name || 'Unassigned'}</p>
            <p className="text-sm text-gray-600"><span className="text-gray-400">Created By:</span> {task.createdBy?.name || '--'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-2">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description || <span className="italic text-gray-400">No description.</span>}</p>
          </div>
        </div>
      )}
    </div>
  );
}
