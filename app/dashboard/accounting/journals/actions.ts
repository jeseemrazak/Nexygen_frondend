'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function seedDefaultJournals() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/accounting/journals/seed-defaults`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  revalidatePath('/dashboard/accounting/journals');
  redirect('/dashboard/accounting/journals');
}

export async function toggleJournalActive(formData: FormData) {
  const id = formData.get('id') as string;
  const isActive = formData.get('isActive') === 'true';

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/accounting/journals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ isActive: !isActive }),
  });

  revalidatePath('/dashboard/accounting/journals');
  redirect('/dashboard/accounting/journals');
}
