'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function updatePayrollConfig(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/payroll/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      grsiaEmployeePercent: parseFloat(formData.get('grsiaEmployeePercent') as string),
      grsiaEmployerPercent: parseFloat(formData.get('grsiaEmployerPercent') as string),
      workingDaysPerMonth: parseFloat(formData.get('workingDaysPerMonth') as string),
      workingHoursPerDay: parseFloat(formData.get('workingHoursPerDay') as string),
      overtimeMultiplier: parseFloat(formData.get('overtimeMultiplier') as string),
      nightOvertimeMultiplier: parseFloat(formData.get('nightOvertimeMultiplier') as string),
      eosWeeksPerYear: parseFloat(formData.get('eosWeeksPerYear') as string),
    }),
  });

  if (!res.ok) {
    redirect('/dashboard/payroll/config?error=true');
  }

  revalidatePath('/dashboard/payroll/config');
  redirect('/dashboard/payroll/config?saved=true');
}
