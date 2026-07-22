import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import DocumentPrintView from '@/components/print/DocumentPrintView';
import PrintButton from '@/components/print/PrintButton';

async function getRfq(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/rfqs/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function RfqPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rfq, settings] = await Promise.all([getRfq(id), getCompanySettings()]);

  if (!rfq) return <div className="p-8 text-center text-rose-500 font-bold">RFQ not found.</div>;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/rfqs/${id}`} className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to RFQ</Link>
        <PrintButton />
      </div>
      <DocumentPrintView
        settings={settings}
        title="Request for Quotation"
        number={`RFQ-${String(rfq.id).padStart(4, '0')}`}
        date={formatDate(rfq.createdAt)}
        meta={[{ label: 'Warehouse', value: rfq.warehouse?.name || 'Unknown' }]}
        statusBadge={rfq.status}
        columns={[{ key: 'qty', label: 'Qty Needed' }]}
        lines={rfq.items.map((item: any) => ({
          description: item.product?.name,
          qty: item.quantity,
        }))}
      />
    </div>
  );
}
