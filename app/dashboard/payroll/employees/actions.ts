'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

function buildEmployeePayload(formData: FormData) {
  return {
    name: formData.get('name') as string,
    isQatari: formData.get('isQatari') === 'on',
    qidNumber: (formData.get('qidNumber') as string) || undefined,
    qidExpiryDate: (formData.get('qidExpiryDate') as string) || undefined,
    passportNumber: (formData.get('passportNumber') as string) || undefined,
    passportExpiryDate: (formData.get('passportExpiryDate') as string) || undefined,
    visaExpiryDate: (formData.get('visaExpiryDate') as string) || undefined,
    bankName: (formData.get('bankName') as string) || undefined,
    iban: (formData.get('iban') as string) || undefined,
    basicSalary: parseFloat(formData.get('basicSalary') as string) || 0,
    housingAllowance: parseFloat(formData.get('housingAllowance') as string) || 0,
    transportationAllowance: parseFloat(formData.get('transportationAllowance') as string) || 0,
    telephoneAllowance: parseFloat(formData.get('telephoneAllowance') as string) || 0,
    otherAllowance: parseFloat(formData.get('otherAllowance') as string) || 0,
    hireDate: (formData.get('hireDate') as string) || undefined,
  };
}

export async function createEmployee(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(buildEmployeePayload(formData)),
  });

  if (!res.ok) {
    redirect('/dashboard/payroll/employees/new?error=true');
  }

  revalidatePath('/dashboard/payroll/employees');
  redirect('/dashboard/payroll/employees');
}

export async function updateEmployee(formData: FormData) {
  const id = formData.get('id') as string;
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ...buildEmployeePayload(formData), payrollActive: formData.get('payrollActive') === 'on' }),
  });

  if (!res.ok) {
    redirect(`/dashboard/payroll/employees/${id}/edit?error=true`);
  }

  revalidatePath('/dashboard/payroll/employees');
  redirect('/dashboard/payroll/employees');
}
