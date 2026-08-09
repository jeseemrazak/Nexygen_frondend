import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import OpenSessionForm from './OpenSessionForm';
import CloseSessionButton from './CloseSessionButton';

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

export default async function PosSessionsPage() {
  const [sessions, warehouses, staff, settings] = await Promise.all([getSessions(), getWarehouses(), getPosStaff(), getCompanySettings()]);
  const requireCashCount = settings?.posRequireCashCount ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">POS Sessions</h1>
        <p className="text-sm text-gray-500 mt-1">One open session per warehouse at a time — a checkout needs an open session to sell against.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Open a Session</h2>
        <OpenSessionForm warehouses={warehouses} staff={staff} />
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
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${s.status === 'OPEN' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/pos/sessions/${s.id}`} className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
                        View
                      </Link>
                      {s.status === 'OPEN' && <CloseSessionButton sessionId={s.id} staff={staff} requireCashCount={requireCashCount} />}
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
