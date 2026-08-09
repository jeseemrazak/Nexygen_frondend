import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getArAging(asOf?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/ar-aging${asOf ? `?asOf=${asOf}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return { rows: [], totals: { total: 0 } };
    return await res.json();
  } catch {
    return { rows: [], totals: { total: 0 } };
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function ArAgingPrintPage({ searchParams }: { searchParams: Promise<{ asOf?: string }> }) {
  const resolvedParams = await searchParams;
  const [data, settings] = await Promise.all([getArAging(resolvedParams.asOf), getCompanySettings()]);

  const rows = data.rows.map((r: any) => ({
    invoiceNumber: r.invoiceNumber,
    party: r.clientName,
    invoiceDate: formatDate(r.invoiceDate),
    totalAmount: r.totalAmount,
    amountPaid: r.amountPaid,
    outstanding: r.outstanding,
    daysOverdue: r.daysOverdue,
    bucket: r.bucket,
  }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/accounting/reports/ar-aging" className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to AR Aging</Link>
        <PrintButton />
      </div>
      <TabularReportView
        settings={settings}
        reportKey="agedReceivables"
        title="Aged Receivables"
        dateRangeLabel={resolvedParams.asOf ? `As of ${resolvedParams.asOf}` : undefined}
        rows={rows}
        totals={{ outstanding: data.totals?.total || 0 }}
      />
    </div>
  );
}
