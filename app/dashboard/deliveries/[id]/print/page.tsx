import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getDelivery(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/deliveries/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function DeliveryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [delivery, settings] = await Promise.all([getDelivery(id), getCompanySettings()]);

  if (!delivery) return <div className="p-8 text-center text-rose-500 font-bold">Delivery not found.</div>;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/deliveries/${id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Delivery</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Delivery Note"
        number={`DEL-${String(delivery.id).padStart(4, '0')}`}
        date={formatDate(delivery.createdAt)}
        party={delivery.salesOrder?.clientName || 'Walk-in'}
        partyLabel="Client"
        meta={[
          { label: 'Warehouse', value: delivery.salesOrder?.warehouse?.name || 'Unknown' },
          { label: 'Sales Order', value: `SO-${String(delivery.salesOrderId).padStart(4, '0')}` },
        ]}
        statusBadge={delivery.status}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'expiryDate', label: 'Expiry' },
        ]}
        lines={delivery.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate ? formatDate(item.expiryDate) : 'N/A',
        }))}
      />
    </div>
  );
}
