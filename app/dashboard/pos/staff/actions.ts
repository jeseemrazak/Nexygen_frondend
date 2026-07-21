'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createPosStaff(formData: FormData) {
  const name = formData.get('name') as string;
  const pin = formData.get('pin') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/pos-staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, pin }),
  });

  if (!res.ok) {
    redirect('/dashboard/pos/staff?error=true');
  }

  revalidatePath('/dashboard/pos/staff');
  redirect('/dashboard/pos/staff');
}

export async function togglePosStaffActive(formData: FormData) {
  const id = formData.get('id') as string;
  const isActive = formData.get('isActive') === 'true';

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/pos-staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ isActive: !isActive }),
  });

  revalidatePath('/dashboard/pos/staff');
  redirect('/dashboard/pos/staff');
}
