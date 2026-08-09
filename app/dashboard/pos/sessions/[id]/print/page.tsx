import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getSession(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sessions/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-QA', { hour: 'numeric', minute: '2-digit', hour12: true });
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function PosSessionPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, settings] = await Promise.all([getSession(id), getCompanySettings()]);

  if (!session) return <div className="p-8 text-center text-rose-500 font-bold">Session not found.</div>;

  const activeSales = session.sales.filter((s: any) => !s.cancelledAt);
  const rows = session.sales.map((s: any) => ({
    time: formatTime(s.createdAt),
    invoiceNumber: s.invoiceNumber,
    staffName: s.servedBy?.name || '—',
    paymentMethod: s.paymentMethod?.name,
    subtotal: s.totalAmount + s.discountAmount,
    discount: s.discountAmount,
    total: s.totalAmount,
    status: s.cancelledAt ? 'CANCELLED' : 'OK',
  }));
  const totals = {
    total: activeSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
    discount: activeSales.reduce((sum: number, s: any) => sum + s.discountAmount, 0),
  };

  // Product breakdown across this session's non-cancelled sales — item.price × quantity is
  // pre-discount, same convention as the Z-Report's product table.
  const byProduct = new Map<number, { productId: number; productName: string; quantity: number; total: number }>();
  for (const sale of activeSales) {
    for (const item of sale.items || []) {
      const entry = byProduct.get(item.productId) || { productId: item.productId, productName: item.product?.name || 'Unknown', quantity: 0, total: 0 };
      entry.quantity += item.quantity;
      entry.total += item.quantity * item.price;
      byProduct.set(item.productId, entry);
    }
  }
  const productRows = Array.from(byProduct.values()).sort((a, b) => b.total - a.total);
  const productGrossTotal = productRows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href={`/dashboard/pos/sessions/${id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Session</Link>
        <PrintButton />
      </div>
      <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
        <Letterhead
          settings={settings}
          title="POS Session Report"
          subtitle={`Session #${session.id} — ${session.warehouse?.name} — ${formatDate(session.openedAt)}`}
          accentColor={settings?.reportAccentColor || '0D9488'}
        />

        <TabularReportView
          settings={settings}
          reportKey="posSessionReport"
          title="POS Session Report"
          dateRangeLabel={`Session #${session.id} — ${session.warehouse?.name} — ${formatDate(session.openedAt)}`}
          hideLetterhead
          rows={rows}
          totals={totals}
        />

        <TabularReportView
          settings={settings}
          reportKey="posByProduct"
          title=""
          hideLetterhead
          sectionLabel="By Product"
          rows={productRows}
          totals={{ total: productGrossTotal }}
        />
      </div>
    </div>
  );
}
