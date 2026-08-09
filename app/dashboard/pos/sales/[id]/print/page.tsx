import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getSale(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sales/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function PosSaleReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [sale, settings] = await Promise.all([getSale(resolvedParams.id), getCompanySettings()]);
  if (!sale) return <div className="p-8 text-center text-rose-500 font-bold">POS sale not found.</div>;

  const meta = [
    { label: 'Payment Method', value: sale.paymentMethod?.name || '--' },
    { label: 'Served By', value: sale.servedBy?.name || '--' },
    { label: 'Warehouse', value: sale.session?.warehouse?.name || '--' },
  ];
  if (sale.discountAmount > 0) meta.push({ label: 'Discount', value: `-${formatQAR(sale.discountAmount)}` });

  const lines = sale.items.map((item: any) => ({
    description: item.product?.name || `#${item.productId}`,
    qty: item.quantity,
    unitPrice: item.price,
    total: item.price * item.quantity,
  }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/pos/sales/${resolvedParams.id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Sale</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Receipt"
        number={sale.invoiceNumber || `#${sale.id}`}
        date={formatDate(sale.createdAt)}
        party={sale.clientName || 'Walk-in'}
        partyLabel="Customer"
        meta={meta}
        lines={lines}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'total', label: 'Total' },
        ]}
        totalAmount={sale.totalAmount}
        statusBadge={sale.cancelledAt ? 'CANCELLED' : undefined}
      />
      {settings?.posReceiptFooter && (
        <p className="print-area max-w-4xl mx-auto px-10 -mt-6 pb-10 text-xs text-gray-500 text-center whitespace-pre-line">
          {settings.posReceiptFooter}
        </p>
      )}
    </div>
  );
}
