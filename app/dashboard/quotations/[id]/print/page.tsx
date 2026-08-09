import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getQuotation(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/quotations/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quotation, settings] = await Promise.all([getQuotation(id), getCompanySettings()]);

  if (!quotation) return <div className="p-8 text-center text-rose-500 font-bold">Quotation not found.</div>;

  const subtotal = quotation.subtotal || quotation.totalAmount;
  const discountAmount = subtotal - quotation.totalAmount + (quotation.taxAmount || 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/quotations/${id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Quotation</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Quotation"
        number={`QT-${String(quotation.id).padStart(4, '0')}`}
        date={formatDate(quotation.createdAt)}
        party={quotation.clientName || 'Walk-in'}
        partyLabel="Client"
        meta={[
          { label: 'Warehouse', value: quotation.warehouse?.name || 'Unknown' },
          ...(quotation.validUntil ? [{ label: 'Valid Until', value: formatDate(quotation.validUntil) }] : []),
          ...(quotation.customerReference ? [{ label: 'Customer Ref', value: quotation.customerReference }] : []),
        ]}
        statusBadge={quotation.status}
        subtotal={subtotal}
        discountLabel={quotation.discountType === 'PERCENT' ? `Discount (${quotation.discountValue}%)` : 'Discount'}
        discountAmount={discountAmount}
        taxLabel={quotation.tax?.name ? `Tax (${quotation.tax.name})` : 'Tax'}
        taxAmount={quotation.taxAmount}
        totalAmount={quotation.totalAmount}
        terms={quotation.termsAndConditions}
        columns={[
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'total', label: 'Total' },
        ]}
        lines={quotation.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        }))}
      />
    </div>
  );
}
