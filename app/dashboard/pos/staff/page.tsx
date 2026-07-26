import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { createPosStaff, togglePosStaffActive } from './actions';
import ResetPinButton from './ResetPinButton';

async function getPosStaff() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/pos-staff`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function PosStaffPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const staff = await getPosStaff();
  const hasError = resolvedSearchParams.error === 'true';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">POS Staff</h1>
        <p className="text-sm text-gray-500 mt-1">Staff attribute sales via a PIN at checkout — this isn't a dashboard login.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Add Staff</h2>
        {hasError && <p className="text-rose-600 text-sm font-semibold mb-3">Failed to create staff — check the PIN is 4-6 digits.</p>}
        <form action={createPosStaff} className="flex gap-3">
          <input
            type="text" name="name" required
            placeholder="Name"
            className="w-full border border-gray-300 rounded-md p-3 text-black"
          />
          <input
            type="text" name="pin" required minLength={4} maxLength={6} pattern="[0-9]{4,6}"
            placeholder="PIN (4-6 digits)"
            className="w-48 border border-gray-300 rounded-md p-3 text-black"
          />
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 rounded-md shadow-sm whitespace-nowrap">
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {staff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No POS staff yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {staff.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 font-bold text-gray-800">{s.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <ResetPinButton staffId={s.id} />
                      <form action={togglePosStaffActive}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="isActive" value={String(s.isActive)} />
                        <button type="submit" className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline">
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
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
