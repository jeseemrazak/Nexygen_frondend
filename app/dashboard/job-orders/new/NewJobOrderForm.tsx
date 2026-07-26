'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function NewJobOrderForm({
  vehicles,
  warehouses,
  technicians,
  defaultVehicleId,
}: {
  vehicles: any[];
  warehouses: any[];
  technicians: any[];
  defaultVehicleId?: string;
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [description, setDescription] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !warehouseId) return setError('Select a vehicle and a warehouse.');
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        vehicleId: Number(vehicleId),
        warehouseId: Number(warehouseId),
        technicianId: technicianId ? Number(technicianId) : undefined,
        description: description || undefined,
        odometerReading: odometerReading ? Number(odometerReading) : undefined,
        notes: notes || undefined,
      }),
    });
    if (res.ok) {
      const jobOrder = await res.json();
      router.push(`/dashboard/job-orders/${jobOrder.id}`);
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to create job order.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle *</label>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 text-black bg-white">
          <option value="">Select vehicle...</option>
          {vehicles.map((v: any) => (
            <option key={v.id} value={v.id}>{v.plateNumber} {[v.make, v.model].filter(Boolean).join(' ')}{v.customer ? ` — ${v.customer.name}` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Warehouse (for parts) *</label>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 text-black bg-white">
          <option value="">Select warehouse...</option>
          {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Technician</label>
        <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 text-black bg-white">
          <option value="">Unassigned</option>
          {technicians.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Odometer Reading</label>
        <input value={odometerReading} onChange={(e) => setOdometerReading(e.target.value)} type="number" className="w-full border border-gray-300 rounded-md p-2.5 text-black" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Complaint</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md p-2.5 text-black" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-md p-2.5 text-black" />
      </div>

      {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-md shadow-sm disabled:bg-gray-300">
        {isSubmitting ? 'Creating...' : 'Create Job Order'}
      </button>
    </form>
  );
}
