'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function updateCompanyProfile(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/settings/company`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: (formData.get('name') as string) || '',
      address: (formData.get('address') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      taxNumber: (formData.get('taxNumber') as string) || undefined,
      footerNote: (formData.get('footerNote') as string) || undefined,
      termsAndConditions: (formData.get('termsAndConditions') as string) || undefined,
      reportShowLogo: formData.get('reportShowLogo') === 'on',
      reportShowAddress: formData.get('reportShowAddress') === 'on',
      reportShowPhone: formData.get('reportShowPhone') === 'on',
      reportShowEmail: formData.get('reportShowEmail') === 'on',
      reportShowWebsite: formData.get('reportShowWebsite') === 'on',
      reportShowFooter: formData.get('reportShowFooter') === 'on',
    }),
  });

  if (!res.ok) {
    redirect('/dashboard/settings/company?error=true');
  }

  revalidatePath('/dashboard/settings/company');
  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard/settings/company?saved=true');
}

export async function uploadCompanyLogo(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    redirect('/dashboard/settings/company?error=true');
  }

  const uploadData = new FormData();
  uploadData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/settings/company/logo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: uploadData,
  });

  if (!res.ok) {
    redirect('/dashboard/settings/company?error=true');
  }

  revalidatePath('/dashboard/settings/company');
  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard/settings/company?saved=true');
}
