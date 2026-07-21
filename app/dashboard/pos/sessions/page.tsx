import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { openSession, closeSession } from './actions';

async function getSessions() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sessions`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getWarehouses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/warehouses`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getPosStaff() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-staff?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default async function PosSessionsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [sessions, warehouses, staff] = await Promise.all([getSessions(), getWarehouses(), getPosStaff()]);
  const hasError = resolvedSearchParams.error === 'true';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">POS Sessions</h1>
        <p className="text-sm text-gray-500 mt-1">One open session per warehouse at a time — a checkout needs an open session to sell against.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Open a Session</h2>
        {hasError && <p className="text-rose-600 text-sm font-semibold mb-3">Failed to open session — that warehouse may already have one open.</p>}
        <form action={openSession} className="flex gap-3">
          <select name="warehouseId" required className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
            <option value="">Select warehouse...</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select name="openedById" className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
            <option value="">Opened by (optional)...</option>
            {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 rounded-md shadow-sm whitespace-nowrap">
            Open Session
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No sessions yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Opened</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Closed</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Sales</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {sessions.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-800">#{s.id}</td>
                  <td className="py-4 px-6 text-sm">{s.warehouse?.name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDateTime(s.openedAt)}{s.openedBy ? ` · ${s.openedBy.name}` : ''}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{s.closedAt ? formatDateTime(s.closedAt) : '--'}</td>
                  <td className="py-4 px-6 text-sm text-center">{s._count?.sales ?? 0}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${s.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {s.status === 'OPEN' && (
                      <form action={closeSession} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <select name="closedById" className="border border-gray-300 rounded p-1 text-xs text-black bg-white">
                          <option value="">Closed by...</option>
                          {staff.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
                        </select>
                        <button type="submit" className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline">
                          Close
                        </button>
                      </form>
                    )}
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
