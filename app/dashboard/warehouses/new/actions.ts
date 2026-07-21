'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createWarehouse(formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    // We only send the location if they actually typed something in
    body: JSON.stringify({ name, location: location || undefined }), 
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("BACKEND ERROR:", errorText);
    redirect('/dashboard/warehouses/new?error=true');
  }

  // Purge caches so the new warehouse shows up instantly
  revalidatePath('/dashboard/warehouses');
  revalidatePath('/dashboard/inventory'); 
  
  redirect('/dashboard/warehouses');
}