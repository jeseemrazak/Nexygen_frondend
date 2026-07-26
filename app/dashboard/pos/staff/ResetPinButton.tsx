'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken } from '@/lib/config';

export default function ResetPinButton({ staffId }: { staffId: number }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    const pin = prompt('Enter a new 4-6 digit PIN:');
    if (!pin) return;
    if (!/^\d{4,6}$/.test(pin)) {
      alert('PIN must be 4-6 digits.');
      return;
    }
    setIsSubmitting(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-staff/${staffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pin }),
    });
    setIsSubmitting(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to reset PIN.');
    }
  };

  return (
    <button onClick={handleReset} disabled={isSubmitting} className="text-slate-500 hover:text-slate-700 font-semibold text-sm underline disabled:opacity-50">
      Reset PIN
    </button>
  );
}
