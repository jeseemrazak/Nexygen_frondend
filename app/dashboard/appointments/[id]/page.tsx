'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  NO_SHOW: 'bg-rose-50 text-rose-700',
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [appointmentAt, setAppointmentAt] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAppt = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/appointments/${params.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setAppt(data);
      setTitle(data.title);
      setAppointmentAt(toLocalInputValue(data.appointmentAt));
      setNotes(data.notes || '');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppt(); }, []);

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchAppt();
    setStatusUpdating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, appointmentAt: new Date(appointmentAt).toISOString(), notes: notes || undefined }),
      });
      if (res.ok) { await fetchAppt(); setEditing(false); }
      else { const e = await safeJson(res); setError(e?.message || 'Failed to save.'); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this appointment?')) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/appointments/${appt.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) router.push('/dashboard/appointments');
    else alert('Failed to delete appointment.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;
  if (!appt) return <div className="p-8 text-center text-rose-500 font-bold">Appointment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/appointments" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">← Back to Appointments</Link>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 flex-wrap">
              {appt.title}
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[appt.status]}`}>{appt.status.replace('_', ' ')}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">{new Date(appt.appointmentAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
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
              disabled={statusUpdating || s === appt.status}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition disabled:cursor-default ${
                s === appt.status ? `${STATUS_STYLES[s]} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {s.replace('_', ' ')}
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
            <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time</label>
            <input required type="datetime-local" value={appointmentAt} onChange={(e) => setAppointmentAt(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>
          <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
            <h2 className="font-bold text-gray-800 mb-2">Details</h2>
            <p className="text-sm text-gray-600"><span className="text-gray-400">With:</span> {appt.customer?.name || appt.lead?.name || '--'}</p>
            <p className="text-sm text-gray-600"><span className="text-gray-400">Staff:</span> {appt.staff?.name || 'Unassigned'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{appt.notes || <span className="italic text-gray-400">No notes.</span>}</p>
          </div>
        </div>
      )}
    </div>
  );
}
