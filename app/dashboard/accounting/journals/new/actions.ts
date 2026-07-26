'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createJournal(formData: FormData) {
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const sequencePrefix = formData.get('sequencePrefix') as string;
  const defaultDebitAccountId = formData.get('defaultDebitAccountId') as string;
  const defaultCreditAccountId = formData.get('defaultCreditAccountId') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/accounting/journals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      code,
      type,
      sequencePrefix,
      defaultDebitAccountId: defaultDebitAccountId ? Number(defaultDebitAccountId) : undefined,
      defaultCreditAccountId: defaultCreditAccountId ? Number(defaultCreditAccountId) : undefined,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("BACKEND ERROR:", errorText);
    redirect('/dashboard/accounting/journals/new?error=true');
  }

  revalidatePath('/dashboard/accounting/journals');
  redirect('/dashboard/accounting/journals');
}
