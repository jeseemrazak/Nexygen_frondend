'use client';

import { useState } from 'react';
import { API_BASE_URL, getClientToken } from '@/lib/config';

// Shared PIN-verification modal — used anywhere a POS action needs to attribute itself to a
// real, PIN-verified staff member (checkout already had its own copy of this; session
// open/close and sale cancellation reuse it here rather than trusting a plain staff dropdown).
export default function StaffPinModal({
  staffList,
  title = 'Staff PIN',
  onVerified,
  onCancel,
}: {
  staffList: any[];
  title?: string;
  onVerified: (result: { id: number; name: string; staffToken: string }) => void;
  onCancel: () => void;
}) {
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setError('');
    if (!staffId) {
      setError('Select a staff member.');
      return;
    }
    setIsVerifying(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-staff/${staffId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const data = await res.json();
      onVerified({ id: data.id, name: data.name, staffToken: data.staffToken });
    } else {
      setError('Incorrect PIN.');
    }
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-3 text-black bg-white mb-3"
        >
          <option value="">Select staff...</option>
          {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="w-full border border-gray-300 rounded-md p-3 text-black text-center text-2xl tracking-widest mb-3"
        />
        {error && <p className="text-rose-600 text-sm font-semibold mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleVerify} disabled={isVerifying} className="px-6 py-2 rounded-md font-bold text-white bg-gray-900 hover:bg-black disabled:opacity-50">
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
