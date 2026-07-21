'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function initializeStock(formData: FormData) {
  // Parse base-10 integers safely
  const warehouseId = parseInt(formData.get('warehouseId') as string, 10);
  const productId = parseInt(formData.get('productId') as string, 10);
  const quantity = parseInt(formData.get('quantity') as string, 10);
  
  const batchNumber = formData.get('batchNumber') as string;
  const expiryDate = formData.get('expiryDate') as string;

  // 🔥 SAFETY CHECK: Stop instantly if the IDs are missing or NaN
  if (isNaN(warehouseId) || isNaN(productId)) {
    throw new Error("Missing Product or Warehouse ID. The form did not receive the URL parameters.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      warehouseId, 
      productId, 
      quantity, 
      batchNumber, 
      expiryDate: expiryDate || undefined 
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 BACKEND REJECTED STOCK INIT 🚨");
    console.error(errorText);
    throw new Error(`Backend Error: ${errorText}`);
  }

  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/inventory');
}