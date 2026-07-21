'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function generateRun(formData: FormData) {
  const periodStart = formData.get('periodStart') as string;
  const periodEnd = formData.get('periodEnd') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/payroll/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ periodStart, periodEnd }),
  });

  if (!res.ok) {
    redirect('/dashboard/payroll/runs?error=true');
  }

  const run = await res.json();
  revalidatePath('/dashboard/payroll/runs');
  redirect(`/dashboard/payroll/runs/${run.id}`);
}
