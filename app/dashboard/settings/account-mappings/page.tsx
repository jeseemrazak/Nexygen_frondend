import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import AccountMappingsTable from './AccountMappingsTable';

async function getData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const headers = { Authorization: `Bearer ${token}` };

  const [mappingsRes, accountsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/accounting/account-mappings`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/accounting/accounts?activeOnly=true`, { headers, cache: 'no-store' }),
  ]);

  const mappings = mappingsRes.ok ? await mappingsRes.json() : [];
  const accounts = accountsRes.ok ? await accountsRes.json() : [];
  return { mappings, accounts };
}

export default async function AccountMappingsPage() {
  const { mappings, accounts } = await getData();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Account Mappings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every automatic posting — deliveries, POS sales, invoices, payroll, stock adjustments — writes to whichever
          account is mapped here instead of a fixed account. Remap any role below to redirect future postings; past
          journal entries are never touched.
        </p>
      </div>

      <AccountMappingsTable mappings={mappings} accounts={accounts} />
    </div>
  );
}
