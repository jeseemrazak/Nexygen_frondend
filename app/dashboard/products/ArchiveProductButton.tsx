'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function ArchiveProductButton({ productId, isActive }: { productId: number; isActive: boolean }) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const verb = isActive ? 'archive' : 'reactivate';
    if (!confirm(`Are you sure you want to ${verb} this product?`)) return;

    setIsSaving(true);
    const token = getCookie('nexygen_token');
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert(`Failed to ${verb} product.`);
      }
    } catch (error) {
      alert('Network error.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isSaving}
      className={`font-semibold text-sm underline disabled:opacity-50 ${
        isActive ? 'text-rose-600 hover:text-rose-800' : 'text-purple-600 hover:text-purple-800'
      }`}
    >
      {isSaving ? 'Saving...' : isActive ? 'Archive' : 'Reactivate'}
    </button>
  );
}
