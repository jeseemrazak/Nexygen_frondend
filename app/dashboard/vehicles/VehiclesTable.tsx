'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

type Vehicle = {
  id: number;
  plateNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  customerId: number | null;
  customer: { id: number; name: string } | null;
  _count?: { jobOrders: number };
};

const Empty = () => <span className="italic text-gray-400">--</span>;

export default function VehiclesTable({ initialVehicles, customers }: { initialVehicles: Vehicle[]; customers: any[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlate, setEditPlate] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editVin, setEditVin] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setEditPlate(v.plateNumber);
    setEditMake(v.make || '');
    setEditModel(v.model || '');
    setEditYear(v.year ? String(v.year) : '');
    setEditColor(v.color || '');
    setEditVin(v.vin || '');
    setEditCustomerId(v.customerId ? String(v.customerId) : '');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const saveEdit = async (id: number) => {
    setEditSaving(true);
    setEditError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        plateNumber: editPlate,
        make: editMake || null,
        model: editModel || null,
        year: editYear ? Number(editYear) : null,
        color: editColor || null,
        vin: editVin || null,
        customerId: editCustomerId ? Number(editCustomerId) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      setEditingId(null);
    } else {
      const err = await safeJson(res);
      setEditError(err?.message || 'Failed to save changes.');
    }
    setEditSaving(false);
  };

  if (vehicles.length === 0) {
    return <div className="p-8 text-center text-gray-500">No vehicles registered yet.</div>;
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Make / Model</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-black">
        {vehicles.map((v) =>
          editingId === v.id ? (
            <tr key={v.id} className="bg-teal-50/40">
              <td colSpan={5} className="p-4">
                {editError && <p className="text-rose-600 text-xs font-semibold mb-2">{editError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={editPlate} onChange={(e) => setEditPlate(e.target.value)} placeholder="Plate Number" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <input value={editMake} onChange={(e) => setEditMake(e.target.value)} placeholder="Make" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <input value={editModel} onChange={(e) => setEditModel(e.target.value)} placeholder="Model" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <input value={editYear} onChange={(e) => setEditYear(e.target.value)} type="number" placeholder="Year" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <input value={editColor} onChange={(e) => setEditColor(e.target.value)} placeholder="Color" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <input value={editVin} onChange={(e) => setEditVin(e.target.value)} placeholder="VIN" className="border border-gray-300 rounded-md p-2 text-black text-sm" />
                  <select value={editCustomerId} onChange={(e) => setEditCustomerId(e.target.value)} className="border border-gray-300 rounded-md p-2 text-black text-sm bg-white sm:col-span-3">
                    <option value="">No owner on file</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-3">
                  <button onClick={cancelEdit} disabled={editSaving} className="text-gray-500 hover:text-gray-700 font-semibold text-sm disabled:opacity-50">Cancel</button>
                  <button onClick={() => saveEdit(v.id)} disabled={editSaving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-1.5 rounded-md text-sm shadow-sm disabled:bg-gray-300">
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 font-mono font-bold text-gray-800">{v.plateNumber}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{[v.make, v.model].filter(Boolean).join(' ') || <Empty />}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{v.year || <Empty />}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{v.customer?.name || <Empty />}</td>
              <td className="py-4 px-6 text-right space-x-3">
                <Link href={`/dashboard/vehicles/${v.id}`} className="text-teal-600 hover:text-teal-800 font-bold text-xs underline">View</Link>
                <button onClick={() => startEdit(v)} className="text-teal-600 hover:text-teal-800 font-bold text-xs underline">Edit</button>
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
