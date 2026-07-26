'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';
import StaffPinModal from '@/components/pos/StaffPinModal';

export default function CancelSaleButton({ saleId }: { saleId: number }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStaff = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/pos-staff?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setStaff(await res.json());
    };
    loadStaff();
  }, []);

  const cancelWithToken = async (cancelledByToken?: string) => {
    setIsCancelling(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-sales/${saleId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cancelledByToken }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to cancel sale.');
      setIsCancelling(false);
    }
  };

  const handleClick = () => {
    if (!confirm('Cancel this sale? The stock will be restocked and the GL entries reversed.')) return;
    setShowPinModal(true);
  };

  return (
    <span className="inline-flex items-center gap-2">
      {showPinModal && (
        <StaffPinModal
          staffList={staff}
          title="Verify PIN to Cancel Sale"
          onVerified={({ staffToken }) => { setShowPinModal(false); cancelWithToken(staffToken); }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      {error && <span className="text-rose-600 text-xs font-semibold">{error}</span>}
      <button onClick={handleClick} disabled={isCancelling} className="text-rose-500 hover:text-rose-700 font-semibold text-xs underline disabled:opacity-50">
        {isCancelling ? 'Cancelling...' : 'Cancel'}
      </button>
    </span>
  );
}
