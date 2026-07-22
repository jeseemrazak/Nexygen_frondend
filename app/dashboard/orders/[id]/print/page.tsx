import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getSalesOrder(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/sales-orders/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function SalesOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getSalesOrder(id), getCompanySettings()]);

  if (!order) return <div className="p-8 text-center text-rose-500 font-bold">Sales Order not found.</div>;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/orders/${id}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Sales Order</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Sales Order"
        number={`SO-${String(order.id).padStart(4, '0')}`}
        date={formatDate(order.createdAt)}
        party={order.clientName || 'Walk-in'}
        partyLabel="Client"
        meta={[{ label: 'Warehouse', value: order.warehouse?.name || 'Unknown' }]}
        statusBadge={order.status}
        totalAmount={order.totalAmount}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'total', label: 'Total' },
        ]}
        lines={order.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        }))}
      />
    </div>
  );
}
