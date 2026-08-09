import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getReceipt(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/receipts/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [receipt, settings] = await Promise.all([getReceipt(id), getCompanySettings()]);

  if (!receipt) return <div className="p-8 text-center text-rose-500 font-bold">Receipt not found.</div>;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/receipts/${id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Receipt</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Goods Receipt"
        number={receipt.receiptNumber || `RCPT-${String(receipt.id).padStart(6, '0')}`}
        date={formatDate(receipt.createdAt)}
        party={receipt.purchaseOrder?.supplier?.name || 'Unknown'}
        partyLabel="Supplier"
        meta={[
          { label: 'Warehouse', value: receipt.purchaseOrder?.warehouse?.name || 'Unknown' },
          { label: 'Purchase Order', value: `PO-${String(receipt.purchaseOrderId).padStart(4, '0')}` },
        ]}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'expiryDate', label: 'Expiry' },
        ]}
        lines={receipt.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate ? formatDate(item.expiryDate) : 'N/A',
        }))}
      />
    </div>
  );
}
