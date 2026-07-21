'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function markOrdered(formData: FormData) {
  const poId = formData.get('poId') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  await fetch(`${API_BASE_URL}/purchase-orders/${poId}/mark-ordered`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  revalidatePath(`/dashboard/purchases/${poId}`);
  redirect(`/dashboard/purchases/${poId}`);
}

export async function createReceipt(formData: FormData) {
  const poId = formData.get('poId') as string;
  const itemIds = formData.getAll('itemIds') as string[];

  const items = itemIds
    .map((itemId) => {
      const quantity = parseInt(formData.get(`qty_${itemId}`) as string, 10);
      const batchNumber = formData.get(`batch_${itemId}`) as string;
      const expiryDate = formData.get(`expiry_${itemId}`) as string;
      return { purchaseOrderItemId: Number(itemId), quantity, batchNumber, expiryDate: expiryDate || undefined };
    })
    .filter((item) => !isNaN(item.quantity) && item.quantity > 0 && item.batchNumber);

  if (items.length === 0) {
    redirect(`/dashboard/purchases/${poId}?error=true`);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/receipts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ purchaseOrderId: Number(poId), items }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 CREATE RECEIPT FAILED:", errorText);
    redirect(`/dashboard/purchases/${poId}?error=true`);
  }

  revalidatePath(`/dashboard/purchases/${poId}`);
  revalidatePath('/dashboard/receipts');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/inventory/movements');
  redirect(`/dashboard/purchases/${poId}`);
}

export async function createBill(formData: FormData) {
  const poId = formData.get('poId') as string;
  const itemIds = formData.getAll('itemIds') as string[];

  const items = itemIds
    .map((itemId) => {
      const quantity = parseInt(formData.get(`billQty_${itemId}`) as string, 10);
      return { purchaseOrderItemId: Number(itemId), quantity };
    })
    .filter((item) => !isNaN(item.quantity) && item.quantity > 0);

  if (items.length === 0) {
    redirect(`/dashboard/purchases/${poId}?error=true`);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ purchaseOrderId: Number(poId), items }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 CREATE BILL FAILED:", errorText);
    redirect(`/dashboard/purchases/${poId}?error=true`);
  }

  revalidatePath(`/dashboard/purchases/${poId}`);
  revalidatePath('/dashboard/purchases/invoices');
  revalidatePath('/dashboard/accounting/trial-balance');
  redirect(`/dashboard/purchases/${poId}`);
}
