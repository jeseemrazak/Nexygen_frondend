import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { seedDefaultAccounts } from './actions';
import AccountRowActions from './AccountRowActions';

async function getAccounts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function ChartOfAccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">The accounts Sales/Purchase activity posts against, plus any you add.</p>
        </div>
        <div className="flex gap-3">
          {accounts.length === 0 && (
            <form action={seedDefaultAccounts}>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm">
                Seed Default Accounts
              </button>
            </form>
          )}
          <Link
            href="/dashboard/accounting/accounts/new"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center gap-2"
          >
            <span>➕</span> Add Account
          </Link>
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            No accounts yet. Click "Seed Default Accounts" to create the minimum Chart of Accounts needed for Sales/Purchase invoices and payments to post automatically.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No accounts found.</div>
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
              {accounts.map((account: any) => (
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
    </div>
  );
}
