import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getReport(from?: string, to?: string, warehouseId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (warehouseId) query.set('warehouseId', warehouseId);
  try {
    const res = await fetch(`${API_BASE_URL}/pos-sales/report?${query.toString()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getWarehouseName(warehouseId?: string) {
  if (!warehouseId) return undefined;
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return undefined;
    const wh = await res.json();
    return wh.name;
  } catch {
    return undefined;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export default async function PosZReportPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; warehouseId?: string }> }) {
  const resolvedParams = await searchParams;
  const [data, settings, warehouseName] = await Promise.all([
    getReport(resolvedParams.from, resolvedParams.to, resolvedParams.warehouseId),
    getCompanySettings(),
    getWarehouseName(resolvedParams.warehouseId),
  ]);

  const accent = settings?.reportAccentColor || '0D9488';
  const rangeLabel = [
    resolvedParams.from && resolvedParams.to ? `${resolvedParams.from} to ${resolvedParams.to}` : resolvedParams.from ? `From ${resolvedParams.from}` : resolvedParams.to ? `Until ${resolvedParams.to}` : 'All Time',
    warehouseName,
  ].filter(Boolean).join(' — ');

  const rows = (data?.byPaymentMethod || []).map((m: any) => ({ method: m.name, count: m.count, total: m.total }));
  // item.price × quantity is pre-discount, so this total is the products' gross value —
  // it won't equal data.totalSales when a flat sale-level discount was applied, by design.
  const productRows = (data?.byProduct || []).map((p: any) => ({ productName: p.name, quantity: p.quantity, total: p.total }));
  const productGrossTotal = productRows.reduce((sum: number, r: any) => sum + r.total, 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/pos/reports" className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Reports</Link>
        <PrintButton />
      </div>
      <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="POS Z-Report" subtitle={rangeLabel} accentColor={accent} />

        <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Transactions</p>
            <p className="font-black text-lg">{data?.transactionCount ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Total Discount</p>
            <p className="font-black text-lg">{formatQAR(data?.totalDiscount ?? 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Cancelled Sales</p>
            <p className="font-black text-lg">{data?.cancelledCount ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Total Takings</p>
            <p className="font-black text-lg" style={{ color: `#${accent}` }}>{formatQAR(data?.totalSales ?? 0)}</p>
          </div>
        </div>

        <TabularReportView
          settings={settings}
          reportKey="posZReport"
          title=""
          hideLetterhead
          sectionLabel="By Payment Method"
          rows={rows}
          totals={{ total: data?.totalSales ?? 0 }}
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
