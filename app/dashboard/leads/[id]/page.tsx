'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

const STAGE_STYLES: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-600',
  CONTACTED: 'bg-blue-50 text-blue-700',
  QUALIFIED: 'bg-amber-50 text-amber-700',
  WON: 'bg-purple-50 text-purple-700',
  LOST: 'bg-rose-50 text-rose-700',
};

function formatDateTime(d?: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  const fetchLead = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/leads/${params.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (res.ok) setLead(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, []);

  const handleStageChange = async (stage: string) => {
    setStageUpdating(true);
    setError('');
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) await fetchLead();
      else { const e = await safeJson(res); setError(e?.message || 'Failed to update stage.'); }
    } finally {
      setStageUpdating(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm(`Convert "${lead.name}" into a Customer?`)) return;
    setConverting(true);
    setError('');
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchLead();
      else { const e = await safeJson(res); setError(e?.message || 'Failed to convert lead.'); }
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/leads/${lead.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) router.push('/dashboard/leads');
    else alert('Failed to delete lead.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;
  if (!lead) return <div className="p-8 text-center text-rose-500 font-bold">Lead not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/leads" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">← Back to Leads</Link>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 flex-wrap">
              {lead.name}
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STAGE_STYLES[lead.stage]}`}>{lead.stage.replace('_', ' ')}</span>
              {lead.convertedCustomer && (
                <Link href={`/dashboard/customers/${lead.convertedCustomer.id}`} className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100">
                  ✓ Converted to Customer
                </Link>
              )}
            </h1>
            {lead.contactPerson && <p className="text-sm text-gray-500 mt-1">{lead.contactPerson}</p>}
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/leads/${lead.id}/edit`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm transition">Edit</Link>
            <button onClick={handleDelete} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-lg border border-rose-200 text-sm transition">Delete</button>
          </div>
        </div>
        {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="font-bold text-gray-800">Pipeline Stage</h2>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => handleStageChange(s)}
              disabled={stageUpdating || s === lead.stage}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition disabled:cursor-default ${
                s === lead.stage ? `${STAGE_STYLES[s]} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        {lead.stage === 'WON' && !lead.convertedCustomer && (
          <button
            onClick={handleConvert}
            disabled={converting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {converting ? 'Converting...' : '→ Convert to Customer'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
          <h2 className="font-bold text-gray-800 mb-2">Contact Details</h2>
          <p className="text-sm text-gray-600"><span className="text-gray-400">Phone:</span> {lead.phone || '--'}</p>
          <p className="text-sm text-gray-600"><span className="text-gray-400">Email:</span> {lead.email || '--'}</p>
          <p className="text-sm text-gray-600"><span className="text-gray-400">Address:</span> {lead.address || '--'}</p>
          <p className="text-sm text-gray-600"><span className="text-gray-400">Source:</span> {lead.source || '--'}</p>
          <p className="text-sm text-gray-600"><span className="text-gray-400">Assigned To:</span> {lead.assignedTo?.name || 'Unassigned'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes || <span className="italic text-gray-400">No notes.</span>}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Appointments</h2>
          <Link href={`/dashboard/appointments/new?leadId=${lead.id}`} className="text-purple-600 hover:text-purple-800 font-bold text-sm">+ Schedule</Link>
        </div>
        {lead.appointments?.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No appointments yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lead.appointments.map((a: any) => (
              <Link key={a.id} href={`/dashboard/appointments/${a.id}`} className="flex justify-between items-center px-6 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(a.appointmentAt)}</p>
                </div>
                <span className="text-xs font-bold text-gray-500">{a.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
