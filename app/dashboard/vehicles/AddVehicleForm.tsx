'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function AddVehicleForm({ customers }: { customers: any[] }) {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        plateNumber: plateNumber.trim(),
        make: make || undefined,
        model: model || undefined,
        year: year ? Number(year) : undefined,
        color: color || undefined,
        vin: vin || undefined,
        customerId: customerId ? Number(customerId) : undefined,
      }),
    });
    if (res.ok) {
      setPlateNumber(''); setMake(''); setModel(''); setYear(''); setColor(''); setVin(''); setCustomerId('');
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to add vehicle.');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="Plate Number *" required className="border border-gray-300 rounded-md p-2.5 text-black" />
        <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" className="border border-gray-300 rounded-md p-2.5 text-black" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="border border-gray-300 rounded-md p-2.5 text-black" />
        <input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="Year" className="border border-gray-300 rounded-md p-2.5 text-black" />
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className="border border-gray-300 rounded-md p-2.5 text-black" />
        <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN / Chassis No." className="border border-gray-300 rounded-md p-2.5 text-black" />
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="border border-gray-300 rounded-md p-2.5 text-black bg-white sm:col-span-3">
          <option value="">No owner on file</option>
          {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-md shadow-sm disabled:bg-gray-300">
        {isSubmitting ? 'Adding...' : 'Add Vehicle'}
      </button>
    </form>
  );
}
