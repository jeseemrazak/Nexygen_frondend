import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export type ModuleConfigField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'boolean' | 'select';
  options?: string[];
  helpText?: string;
};

export type AppModule = {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  configFields: ModuleConfigField[];
  isActive: boolean;
  installedAt: string | null;
  config: Record<string, unknown>;
};

export async function getAppModules(): Promise<AppModule[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/app-modules`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getAppModule(key: string): Promise<AppModule | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/app-modules/${key}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
