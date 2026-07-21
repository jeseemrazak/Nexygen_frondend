import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { seedDefaultJournals, toggleJournalActive } from './actions';

async function getJournals() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/journals`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const typeBadge: Record<string, string> = {
  SALE: 'bg-teal-50 text-teal-700',
  PURCHASE: 'bg-blue-50 text-blue-700',
  CASH: 'bg-emerald-50 text-emerald-700',
  BANK: 'bg-indigo-50 text-indigo-700',
  MISC: 'bg-slate-100 text-slate-600',
};

export default async function JournalsPage() {
  const journals = await getJournals();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Journals</h1>
          <p className="text-sm text-gray-500 mt-1">Cash/Bank/Sales/Purchase journals — pick one when recording a payment to control which account it hits.</p>
        </div>
        {journals.length === 0 && (
          <form action={seedDefaultJournals}>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm">
              Seed Default Journals
            </button>
          </form>
        )}
      </div>

      {journals.length === 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            No journals yet. Seed the Chart of Accounts first (Chart of Accounts page), then click &quot;Seed Default Journals&quot; here.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {journals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No journals found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Debit</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Credit</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {journals.map((j: any) => (
                <tr key={j.id} className={`hover:bg-gray-50 transition-colors ${!j.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-mono font-bold text-gray-800">{j.code}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">{j.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${typeBadge[j.type] || typeBadge.MISC}`}>{j.type}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 font-mono">{j.defaultDebitAccount ? `${j.defaultDebitAccount.code} ${j.defaultDebitAccount.name}` : '--'}</td>
                  <td className="py-4 px-6 text-sm text-gray-500 font-mono">{j.defaultCreditAccount ? `${j.defaultCreditAccount.code} ${j.defaultCreditAccount.name}` : '--'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${j.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {j.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <form action={toggleJournalActive}>
                      <input type="hidden" name="id" value={j.id} />
                      <input type="hidden" name="isActive" value={String(j.isActive)} />
                      <button type="submit" className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline">
                        {j.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
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
