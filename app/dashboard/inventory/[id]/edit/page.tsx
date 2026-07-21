import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

// Server Action
async function updateInventoryRecord(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const batchNumber = formData.get('batchNumber') as string;
  const expiryDate = formData.get('expiryDate') as string;

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        quantity, 
        batchNumber, 
        expiryDate: expiryDate || null 
      }),
    });

    if (!res.ok) throw new Error("Failed to update batch.");
  } catch (error) {
    console.error("Update error:", error);
    // You could redirect back with an error param if desired
    return; 
  }

  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/inventory');
}

function formatDateForInput(dateString: string | null) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default async function AdjustInventoryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const targetId = parseInt(resolvedParams.id, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store' 
  });
  
  const warehouses = await res.json();
  
  let targetInv = null;
  
  if (Array.isArray(warehouses)) {
    for (const w of warehouses) {
      const found = w.inventories?.find((i: any) => i.id === targetId);
      if (found) {
        targetInv = found;
        break;
      }
    }
  }

  if (!targetInv) return <div className="p-8 text-center text-red-500 font-bold mt-10 bg-white rounded-lg border border-gray-200">Record not found.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Adjust Stock</h1>
          <div className="text-sm font-bold text-teal-700 mt-1">
            {targetInv.product?.name || "Unknown Product"} 
            <span className="text-gray-400 font-normal mx-2">|</span> 
            Batch: <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded font-mono">{targetInv.batchNumber}</span>
          </div>
        </div>
        <Link href="/dashboard/inventory" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-yellow-400">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6 text-sm font-medium">
          ⚠️ Admin Override: Editing this batch will update global stock levels immediately.
        </div>

        <form action={updateInventoryRecord} className="space-y-6">
          <input type="hidden" name="id" value={targetInv.id} />
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Physical Quantity</label>
            <input type="number" name="quantity" min="0" defaultValue={targetInv.quantity} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Batch Number</label>
            <input type="text" name="batchNumber" defaultValue={targetInv.batchNumber} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black font-mono" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
            <input type="date" name="expiryDate" defaultValue={formatDateForInput(targetInv.expiryDate)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
          </div>

          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md shadow-sm transition">
            Confirm Override
          </button>
        </form>
      </div>
    </div>
  );
}