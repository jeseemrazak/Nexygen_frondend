'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AccountRowActions from './AccountRowActions';

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

// Tab labels/order match Meza ERP's own Chart of Accounts filter bar exactly ("Revenue", not
// "Income", even though this app's Account.type enum value is INCOME) — Meza also has an
// "Off Balance Sheet" tab with no equivalent in this app's Account model, so it's omitted here.
const TABS: { label: string; type: AccountType | 'ALL' }[] = [
  { label: 'All', type: 'ALL' },
  { label: 'Assets', type: 'ASSET' },
  { label: 'Liabilities', type: 'LIABILITY' },
  { label: 'Equity', type: 'EQUITY' },
  { label: 'Revenue', type: 'INCOME' },
  { label: 'Expenses', type: 'EXPENSE' },
];

export default function AccountsFilterTable({ accounts }: { accounts: any[] }) {
  const [activeType, setActiveType] = useState<AccountType | 'ALL'>('ALL');

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: accounts.length };
    for (const t of ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']) {
      c[t] = accounts.filter((a) => a.type === t).length;
    }
    return c;
  }, [accounts]);

  const filtered = activeType === 'ALL' ? accounts : accounts.filter((a) => a.type === activeType);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 px-4 pt-3">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveType(tab.type)}
            className={`px-4 py-2 text-sm font-bold rounded-t-md transition-colors ${
              activeType === tab.type
                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label} <span className="text-xs font-normal text-gray-400">({counts[tab.type]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No accounts in this category.</div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-black">
            {filtered.map((account: any) => (
              <tr key={account.id} className={`hover:bg-gray-50 transition-colors ${!account.isActive ? 'opacity-50' : ''}`}>
                <td className="py-4 px-6 font-mono font-bold text-gray-800">{account.code}</td>
                <td className="py-4 px-6 font-bold text-gray-800">
                  {account.name}
                  {account.isSystemAccount && (
                    <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">System</span>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{account.type}</td>
                <td className="py-4 px-6 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${account.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/dashboard/accounting/ledger?accountId=${account.id}`} className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline">
                      Ledger
                    </Link>
                    <AccountRowActions account={account} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
