'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/config';

export async function createProduct(formData: FormData) {
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

  // Initial Stock Fields
  const warehouseId = parseInt(formData.get('warehouseId') as string, 10);
  const initialQty = parseInt(formData.get('initialQty') as string, 10);
  const batchNumber = formData.get('batchNumber') as string;
  const expiryDate = formData.get('expiryDate') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Create the Product First
  const productRes = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name, price, costPrice,
      description: description || undefined,
      sku: sku || undefined,
      barcodePcs: barcodePcs || undefined,
      barcodeBox: barcodeBox || undefined,
      type: type || undefined,
      categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
      posCategoryId: posCategoryIdRaw ? Number(posCategoryIdRaw) : undefined,
      unitId: unitIdRaw ? Number(unitIdRaw) : undefined,
      posActive,
    }),
  });

  if (!productRes.ok) {
    redirect('/dashboard/products/new?error=true');
  }

  const newProduct = await productRes.json();

  // 2. If the user provided initial stock, immediately receive it into inventory
  if (!isNaN(warehouseId) && !isNaN(initialQty) && initialQty > 0) {
    await fetch(`${API_BASE_URL}/inventory/receive`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        warehouseId,
        productId: newProduct.id, // Grabbed from the newly created product!
        quantity: initialQty,
        batchNumber: batchNumber || "INITIAL",
        expiryDate: expiryDate || undefined
      }),
    });
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/products');
}