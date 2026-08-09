'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function AdjustStockForm({ inv }: { inv: any }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(inv.quantity));
  const [batchNumber, setBatchNumber] = useState(inv.batchNumber);
  const [expiryDate, setExpiryDate] = useState(formatDateForInput(inv.expiryDate));
  const [reason, setReason] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const newQty = parseInt(quantity, 10) || 0;
  const delta = newQty - inv.quantity;

  const executeUpdate = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/inventory/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        quantity: newQty,
        batchNumber,
        expiryDate: expiryDate || null,
        reason: reason || undefined,
      }),
    });

    if (res.ok) {
      router.push('/dashboard/inventory');
      router.refresh();
    } else {
      const err = await safeJson(res);
      setErrorMessage(err?.message || 'Failed to update batch.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-yellow-400">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900">Confirm Stock Adjustment</h3>
            </div>
            <p className="text-gray-600 mb-2">
              Change quantity for batch <strong className="font-mono">{batchNumber}</strong> from{' '}
              <strong>{inv.quantity}</strong> to <strong>{newQty}</strong>
              {delta !== 0 && (
                <span className={delta > 0 ? 'text-purple-700 font-bold' : 'text-rose-700 font-bold'}>
                  {' '}({delta > 0 ? '+' : ''}{delta})
                </span>
              )}
              .
            </p>
            {delta !== 0 && (
              <p className="text-sm text-gray-500 mb-2">
                This will post a journal entry against Inventory / Inventory Adjustment for the value of the change.
              </p>
            )}
            {errorMessage && <p className="text-rose-600 text-sm font-semibold mb-4">{errorMessage}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeUpdate}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-md font-bold text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? '⏳ Saving...' : 'Yes, Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6 text-sm font-medium">
        ⚠️ Admin Override: Editing this batch will update global stock levels immediately.
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setShowModal(true); }}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Physical Quantity</label>
          <input
            type="number" min="0" required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Batch Number</label>
          <input
            type="text" required
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Reason / Notes (Optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Physical stocktake correction, data entry fix..."
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
          />
        </div>

        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md shadow-sm transition">
          Save Changes
        </button>
      </form>
    </div>
  );
}

function formatDateForInput(dateString: string | null) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return '';
  }
}
