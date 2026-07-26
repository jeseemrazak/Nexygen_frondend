'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function installModule(key: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  await fetch(`${API_BASE_URL}/app-modules/${key}/install`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath('/dashboard/settings/apps');
  redirect('/dashboard/settings/apps');
}

export async function uninstallModule(key: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  await fetch(`${API_BASE_URL}/app-modules/${key}/uninstall`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath('/dashboard/settings/apps');
  redirect('/dashboard/settings/apps');
}

export async function updateModuleConfig(key: string, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const config: Record<string, unknown> = {};
  for (const [field, value] of formData.entries()) {
    if (field === '_booleanFields') continue;
    config[field] = value;
  }
  // Checkbox inputs are omitted from FormData entirely when unchecked, so every boolean field
  // (listed via a hidden input) is explicitly coerced to true/false rather than left absent.
  const booleanFields = (formData.get('_booleanFields') as string)?.split(',').filter(Boolean) || [];
  for (const field of booleanFields) {
    config[field] = formData.get(field) === 'on';
  }

  const res = await fetch(`${API_BASE_URL}/app-modules/${key}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ config }),
  });

  if (!res.ok) {
    redirect(`/dashboard/settings/apps/${key}?error=true`);
  }

  revalidatePath(`/dashboard/settings/apps/${key}`);
  redirect(`/dashboard/settings/apps/${key}?saved=true`);
}
