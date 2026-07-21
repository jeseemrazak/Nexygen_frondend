'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function cancelPosSale(formData: FormData) {
  const id = formData.get('id') as string;
  const reason = formData.get('reason') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/pos-sales/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ reason: reason || undefined }),
  });

  revalidatePath('/dashboard/pos/sales');
}
