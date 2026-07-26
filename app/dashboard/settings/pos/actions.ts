'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function updatePosSettings(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const warehouseId = formData.get('posDefaultWarehouseId') as string;
  const paymentMethodId = formData.get('posDefaultPaymentMethodId') as string;
  const maxDiscount = formData.get('posMaxDiscountPercent') as string;

  const res = await fetch(`${API_BASE_URL}/settings/company`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      posDefaultWarehouseId: warehouseId ? Number(warehouseId) : null,
      posDefaultPaymentMethodId: paymentMethodId ? Number(paymentMethodId) : null,
      posRequireCustomer: formData.get('posRequireCustomer') === 'on',
      posReceiptFooter: (formData.get('posReceiptFooter') as string) || undefined,
      posAutoPrintReceipt: formData.get('posAutoPrintReceipt') === 'on',
      posMaxDiscountPercent: maxDiscount ? Number(maxDiscount) : null,
      posRequireCashCount: formData.get('posRequireCashCount') === 'on',
    }),
  });

  if (!res.ok) {
    redirect('/dashboard/settings/pos?error=true');
  }

  revalidatePath('/dashboard/settings/pos');
  revalidatePath('/dashboard/pos');
  redirect('/dashboard/settings/pos?saved=true');
}
