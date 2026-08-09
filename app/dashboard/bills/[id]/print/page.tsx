import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getBill(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/bills/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function BillPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bill, settings] = await Promise.all([getBill(id), getCompanySettings()]);

  if (!bill) return <div className="p-8 text-center text-rose-500 font-bold">Bill not found.</div>;

  const subtotal = bill.subtotal || bill.totalAmount - (bill.taxAmount || 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/bills/${id}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Bill</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Bill"
        number={bill.billNumber || `BILL-${String(bill.id).padStart(6, '0')}`}
        date={formatDate(bill.createdAt)}
        party={bill.purchaseOrder?.supplier?.name || 'Unknown'}
        partyLabel="Supplier"
        meta={[{ label: 'Purchase Order', value: `PO-${String(bill.purchaseOrderId).padStart(4, '0')}` }]}
        statusBadge={bill.paymentStatus}
        subtotal={subtotal}
        taxLabel={bill.tax?.name ? `Tax (${bill.tax.name})` : 'Tax'}
        taxAmount={bill.taxAmount}
        totalAmount={bill.totalAmount}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Cost' },
          { key: 'total', label: 'Total' },
        ]}
        lines={bill.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          unitPrice: item.unitCost,
          total: item.unitCost * item.quantity,
        }))}
      />
    </div>
  );
}
