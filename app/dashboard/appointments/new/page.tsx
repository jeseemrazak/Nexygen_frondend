'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-bold">Loading...</div>}>
      <NewAppointmentPageInner />
    </Suspense>
  );
}

function NewAppointmentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [appointmentAt, setAppointmentAt] = useState('');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [leadId, setLeadId] = useState(searchParams.get('leadId') || '');
  const [staffId, setStaffId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const [usersRes, customersRes, leadsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/customers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/leads`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!appointmentAt) { setError('Pick a date/time.'); return; }
    setSaving(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, appointmentAt: new Date(appointmentAt).toISOString(),
          customerId: customerId ? Number(customerId) : undefined,
          leadId: leadId ? Number(leadId) : undefined,
          staffId: staffId ? Number(staffId) : undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        const appt = await res.json();
        router.push(`/dashboard/appointments/${appt.id}`);
      } else {
        const errData = await safeJson(res);
        setError(errData?.message || 'Failed to schedule appointment.');
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
        <Link href="/dashboard/appointments" className="text-teal-600 hover:text-teal-800 text-sm font-bold mb-2 inline-block">← Back to Appointments</Link>
        <h1 className="text-2xl font-bold text-gray-800">Schedule Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Site visit, Follow-up call" className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time *</label>
          <input required type="datetime-local" value={appointmentAt} onChange={(e) => setAppointmentAt(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Customer</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); if (e.target.value) setLeadId(''); }} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
              <option value="">None</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lead</label>
            <select value={leadId} onChange={(e) => { setLeadId(e.target.value); if (e.target.value) setCustomerId(''); }} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
              <option value="">None</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Staff</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black bg-white">
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-2 text-black" />
        </div>

        <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50">
          {saving ? 'Scheduling...' : 'Schedule Appointment'}
        </button>
      </form>
    </div>
  );
}
