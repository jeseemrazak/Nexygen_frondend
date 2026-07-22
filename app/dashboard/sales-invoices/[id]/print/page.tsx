import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getInvoice(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/invoices/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([getInvoice(id), getCompanySettings()]);

  if (!invoice) return <div className="p-8 text-center text-rose-500 font-bold">Invoice not found.</div>;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/sales-invoices/${id}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Invoice</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Invoice"
        number={invoice.invoiceNumber || `INV-${String(invoice.id).padStart(6, '0')}`}
        date={formatDate(invoice.createdAt)}
        party={invoice.salesOrder?.clientName || 'Walk-in'}
        partyLabel="Bill To"
        meta={[{ label: 'Sales Order', value: `SO-${String(invoice.salesOrderId).padStart(4, '0')}` }]}
        statusBadge={invoice.paymentStatus}
        totalAmount={invoice.totalAmount}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'total', label: 'Total' },
        ]}
        lines={invoice.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        }))}
      />
    </div>
  );
}
