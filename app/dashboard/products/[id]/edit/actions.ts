'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const costPriceRaw = formData.get('costPrice') as string;
  const costPrice = costPriceRaw ? parseFloat(costPriceRaw) : undefined;
  const description = formData.get('description') as string;
  const sku = formData.get('sku') as string;
  const barcodePcs = formData.get('barcodePcs') as string;
  const barcodeBox = formData.get('barcodeBox') as string;
  const type = formData.get('type') as string;
  const categoryIdRaw = formData.get('categoryId') as string;
  const posCategoryIdRaw = formData.get('posCategoryId') as string;
  const unitIdRaw = formData.get('unitId') as string;
  const posActive = formData.get('posActive') === 'on';

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      price,
      costPrice,
      description: description || null,
      sku: sku || null,
      barcodePcs: barcodePcs || null,
      barcodeBox: barcodeBox || null,
      type: type || undefined,
      categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
      posCategoryId: posCategoryIdRaw ? Number(posCategoryIdRaw) : null,
      unitId: unitIdRaw ? Number(unitIdRaw) : null,
      posActive,
    }),
  });

  if (!res.ok) {
    redirect(`/dashboard/products/${id}/edit?error=true`);
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory'); // Also updates the stock report names!
  redirect('/dashboard/products');
}