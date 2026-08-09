import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { createJournal } from './actions';

async function getAccounts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/accounts?activeOnly=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function NewJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const hasError = resolvedParams.error === 'true';
  const accounts = await getAccounts();

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Journal</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new Cash/Bank/Sales/Purchase journal to record payments against.</p>
        </div>
        <Link
          href="/dashboard/accounting/journals"
          className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">

        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">
              Failed to create journal. The code may already be in use.
            </p>
          </div>
        )}

        <form action={createJournal} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Petty Cash"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-purple-500 focus:border-purple-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                required
                placeholder="e.g., PCASH"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-purple-500 focus:border-purple-500 text-black font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select name="type" required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="SALE">Sale</option>
                <option value="PURCHASE">Purchase</option>
                <option value="MISC">Misc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sequence Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sequencePrefix"
                required
                placeholder="e.g., PC"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-purple-500 focus:border-purple-500 text-black font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Default Debit Account <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select name="defaultDebitAccountId" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="">None</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Default Credit Account <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select name="defaultCreditAccountId" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="">None</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm"
            >
              Save Journal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
