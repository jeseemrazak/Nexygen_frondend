import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getPurchaseOrder(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function PurchaseOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po, settings] = await Promise.all([getPurchaseOrder(id), getCompanySettings()]);

  if (!po) return <div className="p-8 text-center text-rose-500 font-bold">Purchase order not found.</div>;

  const subtotal = po.totalAmount - (po.taxAmount || 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/purchases/${id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Purchase Order</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Purchase Order"
        number={`PO-${String(po.id).padStart(4, '0')}`}
        date={formatDate(po.createdAt)}
        party={po.supplier?.name || 'Unknown'}
        partyLabel="Supplier"
        meta={[
          { label: 'Warehouse', value: po.warehouse?.name || 'Unknown' },
          ...(po.reference ? [{ label: 'Reference', value: po.reference }] : []),
        ]}
        statusBadge={po.status}
        subtotal={subtotal}
        taxLabel={po.tax?.name ? `Tax (${po.tax.name})` : 'Tax'}
        taxAmount={po.taxAmount}
        totalAmount={po.totalAmount}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Cost' },
          { key: 'total', label: 'Total' },
        ]}
        lines={po.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantityOrdered,
          unitPrice: item.unitCost,
          total: item.unitCost * item.quantityOrdered,
        }))}
      />
    </div>
  );
}
