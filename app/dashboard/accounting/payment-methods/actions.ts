'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function seedDefaultPaymentMethods() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/accounting/payment-methods/seed-defaults`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  revalidatePath('/dashboard/accounting/payment-methods');
  redirect('/dashboard/accounting/payment-methods');
}

export async function togglePaymentMethodActive(formData: FormData) {
  const id = formData.get('id') as string;
  const isActive = formData.get('isActive') === 'true';

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/accounting/payment-methods/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ isActive: !isActive }),
  });

  revalidatePath('/dashboard/accounting/payment-methods');
  redirect('/dashboard/accounting/payment-methods');
}
