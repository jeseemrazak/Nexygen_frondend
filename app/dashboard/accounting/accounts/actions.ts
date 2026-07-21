'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createAccount(formData: FormData) {
  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ code, name, type }),
  });

  if (!res.ok) {
    redirect('/dashboard/accounting/accounts/new?error=true');
  }

  revalidatePath('/dashboard/accounting/accounts');
  redirect('/dashboard/accounting/accounts');
}

export async function seedDefaultAccounts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/accounting/accounts/seed-defaults`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  revalidatePath('/dashboard/accounting/accounts');
  redirect('/dashboard/accounting/accounts');
}
