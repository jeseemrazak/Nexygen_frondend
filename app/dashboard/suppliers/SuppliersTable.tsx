'use client';

import { useState } from 'react';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

type Supplier = {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

const Empty = () => <span className="italic text-gray-400">--</span>;

export default function SuppliersTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const startEdit = (s: Supplier) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditContactPerson(s.contactPerson || '');
    setEditPhone(s.phone || '');
    setEditEmail(s.email || '');
    setEditAddress(s.address || '');
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
    const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editName,
        contactPerson: editContactPerson || null,
        phone: editPhone || null,
        email: editEmail || null,
        address: editAddress || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    } else {
      const err = await safeJson(res);
      setEditError(err?.message || 'Failed to save changes.');
    }
    setEditSaving(false);
  };

  if (suppliers.length === 0) {
    return <div className="p-8 text-center text-gray-500">No suppliers found. Click &quot;Add Supplier&quot; to get started.</div>;
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Person</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
          <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-black">
        {suppliers.map((supplier) =>
          editingId === supplier.id ? (
            <tr key={supplier.id} className="bg-purple-50/40">
              <td colSpan={6} className="p-4">
                {editError && <p className="text-rose-600 text-xs font-semibold mb-2">{editError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Person</label>
                    <input value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                    <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-3">
                  <button onClick={cancelEdit} disabled={editSaving} className="text-gray-500 hover:text-gray-700 font-semibold text-sm disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(supplier.id)}
                    disabled={editSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-md text-sm shadow-sm disabled:bg-gray-300"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 font-bold text-gray-800">{supplier.name}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{supplier.contactPerson || <Empty />}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{supplier.phone || <Empty />}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{supplier.email || <Empty />}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{supplier.address || <Empty />}</td>
              <td className="py-4 px-6 text-right">
                <button onClick={() => startEdit(supplier)} className="text-purple-600 hover:text-purple-800 font-bold text-xs underline">
                  Edit
                </button>
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
