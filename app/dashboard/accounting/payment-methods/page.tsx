import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { seedDefaultPaymentMethods, togglePaymentMethodActive } from './actions';

async function getPaymentMethods() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/payment-methods`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function PaymentMethodsPage() {
  const methods = await getPaymentMethods();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Methods</h1>
          <p className="text-sm text-gray-500 mt-1">Used by POS checkout — each one maps to a journal (or bills the customer on credit).</p>
        </div>
        {methods.length === 0 && (
          <form action={seedDefaultPaymentMethods}>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm">
              Seed Default Payment Methods
            </button>
          </form>
        )}
      </div>

      {methods.length === 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            No payment methods yet. Seed Journals first, then click &quot;Seed Default Payment Methods&quot; here.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {methods.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payment methods found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Journal</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {methods.map((m: any) => (
                <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${!m.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold text-gray-800">{m.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${m.type === 'ACCOUNT_RECEIVABLE' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
                      {m.type === 'ACCOUNT_RECEIVABLE' ? 'On Credit' : 'Cash/Bank'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{m.journal?.name || '--'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${m.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <form action={togglePaymentMethodActive}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="isActive" value={String(m.isActive)} />
                      <button type="submit" className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline">
                        {m.isActive ? 'Deactivate' : 'Activate'}
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
