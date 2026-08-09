'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';
import StaffPinModal from '@/components/pos/StaffPinModal';

export default function OpenSessionForm({ warehouses, staff }: { warehouses: any[]; staff: any[] }) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openWithToken = async (openedByToken?: string) => {
    setIsSubmitting(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ warehouseId: Number(warehouseId), openedByToken, openingCash: openingCash ? Number(openingCash) : undefined }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to open session — that warehouse may already have one open.');
    }
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return;
    setShowPinModal(true);
  };

  return (
    <>
      {showPinModal && (
        <StaffPinModal
          staffList={staff}
          title="Verify PIN to Open Session"
          onVerified={({ staffToken }) => { setShowPinModal(false); openWithToken(staffToken); }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
          <option value="">Select warehouse...</option>
          {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          placeholder="Opening cash (QAR)"
          className="w-48 border border-gray-300 rounded-md p-3 text-black"
        />
        <button
          type="button"
          onClick={() => openWithToken(undefined)}
          disabled={!warehouseId || isSubmitting}
          className="border border-gray-300 text-gray-600 font-bold px-4 rounded-md whitespace-nowrap hover:bg-gray-50 disabled:opacity-50"
        >
          Skip PIN
        </button>
        <button type="submit" disabled={!warehouseId || isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-md shadow-sm whitespace-nowrap disabled:bg-gray-300">
          {isSubmitting ? 'Opening...' : 'Open Session'}
        </button>
      </form>
      {error && <p className="text-rose-600 text-sm font-semibold mt-3">{error}</p>}
    </>
  );
}
