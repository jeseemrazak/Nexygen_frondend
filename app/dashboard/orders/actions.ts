'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function assignMerchandiser(formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const userId = formData.get('userId') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId: Number(userId) }),
  });

  if (!res.ok) {
    console.error("Failed to assign user:", await res.text());
  }

  // Purge the cache so the UI updates instantly
  revalidatePath('/dashboard/orders');
}