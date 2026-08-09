'use client';

import { useState } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

type MappingAccount = { id: number; code: string; name: string };
type Mapping = { role: string; label: string; description: string; group: string; account: MappingAccount | null };
type Account = { id: number; code: string; name: string; type: string };

export default function AccountMappingsTable({ mappings, accounts }: { mappings: Mapping[]; accounts: Account[] }) {
  const initial = Object.fromEntries(mappings.map((m) => [m.role, m.account?.id ?? ('' as number | '')]));
  const [selections, setSelections] = useState<Record<string, number | ''>>(initial);
  // Tracks the last-saved value per role so the "dirty" check resets after a successful save
  // instead of comparing forever against the page's original server-rendered props.
  const [savedBaseline, setSavedBaseline] = useState<Record<string, number | ''>>(initial);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);
  const [errorByRole, setErrorByRole] = useState<Record<string, string>>({});

  const groups = Array.from(new Set(mappings.map((m) => m.group)));

  const save = async (role: string) => {
    const accountId = selections[role];
    if (!accountId) return;

    setSavingRole(role);
    setSavedRole(null);
    setErrorByRole((prev) => ({ ...prev, [role]: '' }));

    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/account-mappings/${role}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accountId }),
    });

    setSavingRole(null);
    if (res.ok) {
      setSavedRole(role);
      setSavedBaseline((prev) => ({ ...prev, [role]: accountId }));
      setTimeout(() => setSavedRole((r) => (r === role ? null : r)), 2000);
    } else {
      const err = await safeJson(res);
      setErrorByRole((prev) => ({ ...prev, [role]: err?.message || 'Failed to save.' }));
    }
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{group}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {mappings
              .filter((m) => m.group === group)
              .map((m) => {
                const dirty = selections[m.role] !== savedBaseline[m.role];
                return (
                  <div key={m.role} className="px-6 py-4 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800">{m.label}</div>
                      <div className="text-sm text-gray-500">{m.description}</div>
                      {errorByRole[m.role] && <div className="text-sm text-rose-600 font-semibold mt-1">{errorByRole[m.role]}</div>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={selections[m.role]}
                        onChange={(e) => setSelections((prev) => ({ ...prev, [m.role]: e.target.value ? Number(e.target.value) : '' }))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-black text-sm min-w-[260px]"
                      >
                        <option value="">Not mapped</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => save(m.role)}
                        disabled={!dirty || savingRole === m.role || !selections[m.role]}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold text-sm py-2 px-4 rounded-md whitespace-nowrap transition-colors"
                      >
                        {savingRole === m.role ? 'Saving...' : savedRole === m.role ? '✓ Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
