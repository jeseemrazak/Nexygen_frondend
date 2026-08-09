'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] as const;

const STAGE_STYLES: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
  QUALIFIED: 'bg-amber-50 text-amber-700 border-amber-200',
  WON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOST: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function LeadsPage() {
  const [moduleActive, setModuleActive] = useState<boolean | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      try {
        const modRes = await fetch(`${API_BASE_URL}/app-modules/crm-leads`, { headers: { Authorization: `Bearer ${token}` } });
        const mod = modRes.ok ? await modRes.json() : null;
        setModuleActive(!!mod?.isActive);
        if (!mod?.isActive) { setLoading(false); return; }

        const res = await fetch(`${API_BASE_URL}/leads`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as any });
        if (res.ok) setLeads(await res.json());
      } catch {
        setModuleActive(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;

  if (!moduleActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The CRM module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-teal-600 hover:text-teal-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CRM — Leads Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Prospects, tracked separately from your Customer directory.</p>
        </div>
        <Link
          href="/dashboard/leads/new"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition"
        >
          + Add Lead
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className={`px-4 py-3 border-b font-bold text-xs uppercase tracking-wider flex justify-between items-center ${STAGE_STYLES[stage]}`}>
                <span>{stage.replace('_', ' ')}</span>
                <span className="bg-white/60 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
              </div>
              <div className="p-3 space-y-2 flex-1 min-h-[120px]">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-1">No leads</p>
                ) : (
                  stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className="block bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg p-3 transition"
                    >
                      <p className="font-bold text-gray-800 text-sm">{lead.name}</p>
                      {lead.contactPerson && <p className="text-xs text-gray-500 mt-0.5">{lead.contactPerson}</p>}
                      {lead.assignedTo && <p className="text-[11px] text-teal-600 font-semibold mt-1">👤 {lead.assignedTo.name}</p>}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
