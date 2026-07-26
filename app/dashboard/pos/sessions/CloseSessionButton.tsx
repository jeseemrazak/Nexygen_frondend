'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';
import StaffPinModal from '@/components/pos/StaffPinModal';

export default function CloseSessionButton({ sessionId, staff, requireCashCount = false }: { sessionId: number; staff: any[]; requireCashCount?: boolean }) {
  const router = useRouter();
  const [showCashModal, setShowCashModal] = useState(false);
  const [countedCash, setCountedCash] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState('');

  const closeWithToken = async (closedByToken?: string) => {
    setIsClosing(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-sessions/${sessionId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ closedByToken, countedCash: countedCash ? Number(countedCash) : undefined }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to close session.');
    }
    setIsClosing(false);
  };

  const proceedSkipPin = () => {
    setShowCashModal(false);
    closeWithToken(undefined);
  };

  const proceedWithPin = () => {
    setShowCashModal(false);
    setShowPinModal(true);
  };

  return (
    <div className="inline-flex items-center gap-2">
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Count the Drawer</h3>
            <p className="text-sm text-gray-500 mb-4">
              {requireCashCount ? 'Enter the physically counted cash before closing.' : 'Optional — leave blank to skip till reconciliation.'}
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="Counted cash (QAR)"
              className="w-full border border-gray-300 rounded-md p-3 text-black text-lg mb-4"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={proceedWithPin}
                disabled={requireCashCount && !countedCash}
                className="w-full px-4 py-2.5 rounded-md font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300"
              >
                Verify PIN & Close
              </button>
              <button
                onClick={proceedSkipPin}
                disabled={requireCashCount && !countedCash}
                className="w-full px-4 py-2 rounded-md font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                Skip PIN & Close
              </button>
              <button onClick={() => { setShowCashModal(false); setCountedCash(''); }} className="w-full px-4 py-2 rounded-md font-bold text-gray-400 hover:bg-gray-50 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showPinModal && (
        <StaffPinModal
          staffList={staff}
          title="Verify PIN to Close Session"
          onVerified={({ staffToken }) => { setShowPinModal(false); closeWithToken(staffToken); }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      {error && <span className="text-rose-600 text-xs font-semibold">{error}</span>}
      <button onClick={() => setShowCashModal(true)} disabled={isClosing} className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline disabled:opacity-50">
        {isClosing ? 'Closing...' : 'Close'}
      </button>
    </div>
  );
}
