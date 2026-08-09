import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { seedDefaultAccounts } from './actions';
import AccountsFilterTable from './AccountsFilterTable';

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
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center gap-2"
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

      {accounts.length > 0 && <AccountsFilterTable accounts={accounts} />}
    </div>
  );
}
