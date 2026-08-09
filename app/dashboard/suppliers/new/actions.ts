'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createSupplier(formData: FormData) {
  const name = formData.get('name') as string;
  const contactPerson = formData.get('contactPerson') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const address = formData.get('address') as string;
  const paymentTermId = formData.get('paymentTermId') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      contactPerson: contactPerson || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      paymentTermId: paymentTermId ? Number(paymentTermId) : undefined,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("BACKEND ERROR:", errorText);
    redirect('/dashboard/suppliers/new?error=true');
  }

  revalidatePath('/dashboard/suppliers');
  redirect('/dashboard/suppliers');
}
