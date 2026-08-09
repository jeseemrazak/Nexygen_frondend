import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import PrintButton from '@/components/print/PrintButton';

async function getPayment(id: string, source: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/payments/${id}?source=${source}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PARTY_LABEL: Record<string, { received: string; direction: string }> = {
  CUSTOMER: { received: 'Received From', direction: 'received from' },
  SUPPLIER: { received: 'Paid To', direction: 'paid to' },
};

export default async function PaymentVoucherPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ source?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const source = resolvedSearchParams.source || 'PARTY';

  const [payment, settings] = await Promise.all([getPayment(resolvedParams.id, source), getCompanySettings()]);
  if (!payment) return <div className="p-8 text-center text-rose-500 font-bold">Payment not found.</div>;

  const accent = settings?.reportAccentColor || '0D9488';
  const headerColor = settings?.reportHeaderColor || 'E0E0E0';
  const partyLabel = PARTY_LABEL[payment.partyType] || PARTY_LABEL.CUSTOMER;

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-3xl mx-auto">
        <Link href={`/dashboard/accounting/payments/${resolvedParams.id}?source=${source}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Payment</Link>
        <PrintButton />
      </div>

      <div className="print-area bg-white p-10 max-w-3xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Payment Voucher" subtitle={payment.paymentNumber || `#${payment.id}`} accentColor={accent} />

        <div className="flex justify-between items-start mb-8 text-sm">
          <div className="space-y-0.5">
            <p><span className="text-gray-500">{partyLabel.received}: </span><span className="font-bold">{payment.partyName}</span></p>
            <p><span className="text-gray-500">Method: </span><span className="font-bold">{payment.method || '--'}</span></p>
            {payment.journalName && <p><span className="text-gray-500">Journal: </span><span className="font-bold">{payment.journalName}</span></p>}
          </div>
          <div className="text-right space-y-0.5">
            <p><span className="text-gray-500">Date: </span><span className="font-bold">{formatDate(payment.createdAt)}</span></p>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-6 mb-8" style={{ backgroundColor: `#${headerColor}20` }}>
          <p className="text-xs text-gray-500 uppercase font-bold">Amount {partyLabel.direction}</p>
          <p className="text-3xl font-black mt-1" style={{ color: `#${accent}` }}>{formatQAR(payment.amount)}</p>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr style={{ backgroundColor: `#${headerColor}` }}>
              <th className="py-2 px-3">Document #</th>
              <th className="py-2 px-3 text-right">Amount Allocated</th>
            </tr>
          </thead>
          <tbody>
            {payment.allocations.map((a: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 px-3">{a.documentNumber || `#${a.sourceId}`}</td>
                <td className="py-2 px-3 text-right">{formatQAR(a.amountAllocated)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td className="py-2 px-3 font-black">Total</td>
              <td className="py-2 px-3 text-right font-black">{formatQAR(payment.amount)}</td>
            </tr>
          </tfoot>
        </table>

        {payment.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p className="font-bold mb-1">Notes</p>
            <p className="whitespace-pre-line">{payment.notes}</p>
          </div>
        )}

        <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
          <div className="pt-8 border-t border-gray-400">Prepared By</div>
          <div className="pt-8 border-t border-gray-400">Received By</div>
        </div>
      </div>
    </div>
  );
}
