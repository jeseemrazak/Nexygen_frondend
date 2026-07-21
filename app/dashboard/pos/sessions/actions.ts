'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function openSession(formData: FormData) {
  const warehouseId = formData.get('warehouseId') as string;
  const openedById = formData.get('openedById') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/pos-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ warehouseId: Number(warehouseId), openedById: openedById ? Number(openedById) : undefined }),
  });

  if (!res.ok) {
    redirect('/dashboard/pos/sessions?error=true');
  }

  revalidatePath('/dashboard/pos/sessions');
  redirect('/dashboard/pos/sessions');
}

export async function closeSession(formData: FormData) {
  const id = formData.get('id') as string;
  const closedById = formData.get('closedById') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/pos-sessions/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ closedById: closedById ? Number(closedById) : undefined }),
  });

  revalidatePath('/dashboard/pos/sessions');
  redirect('/dashboard/pos/sessions');
}
