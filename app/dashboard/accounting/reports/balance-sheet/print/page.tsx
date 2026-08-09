import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getBalanceSheet(asOf?: string, warehouseId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const query = new URLSearchParams();
  if (asOf) query.set('asOf', asOf);
  if (warehouseId) query.set('warehouseId', warehouseId);
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/balance-sheet?${query.toString()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
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
    const w = await res.json();
    return w?.name as string | undefined;
  } catch {
    return undefined;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export default async function BalanceSheetPrintPage({ searchParams }: { searchParams: Promise<{ asOf?: string; warehouseId?: string }> }) {
  const resolvedParams = await searchParams;
  const [bs, settings, warehouseName] = await Promise.all([
    getBalanceSheet(resolvedParams.asOf, resolvedParams.warehouseId),
    getCompanySettings(),
    getWarehouseName(resolvedParams.warehouseId),
  ]);

  const dateAndOutletLabel = [
    resolvedParams.asOf ? `As of ${resolvedParams.asOf}` : undefined,
    warehouseName ? `Outlet: ${warehouseName}` : undefined,
  ].filter(Boolean).join(' — ') || undefined;

  const accent = settings?.reportAccentColor || '0D9488';
  const assetRows = (bs?.assetLines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.amount }));
  const liabilityRows = (bs?.liabilityLines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.amount }));
  const equityRows = (bs?.equityLines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.amount }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/accounting/reports" className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Reports</Link>
        <PrintButton />
      </div>
      <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Balance Sheet" subtitle={dateAndOutletLabel} accentColor={accent} />
        <TabularReportView settings={settings} reportKey="balanceSheet" title="" hideLetterhead sectionLabel="Assets" rows={assetRows} totals={{ amount: bs?.totalAssets || 0 }} />
        <TabularReportView settings={settings} reportKey="balanceSheet" title="" hideLetterhead sectionLabel="Liabilities" rows={liabilityRows} totals={{ amount: bs?.totalLiabilities || 0 }} />
        <TabularReportView settings={settings} reportKey="balanceSheet" title="" hideLetterhead sectionLabel="Equity" rows={equityRows} totals={{ amount: bs?.totalEquity || 0 }} />
        <div className="flex justify-between items-center mt-8 pt-4 border-t-2 border-gray-800">
          <span className="font-black text-gray-900">Assets = Liabilities + Equity</span>
          <span className="font-black" style={{ color: `#${accent}` }}>
            {formatQAR(bs?.totalAssets || 0)} = {formatQAR((bs?.totalLiabilities || 0) + (bs?.totalEquity || 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
