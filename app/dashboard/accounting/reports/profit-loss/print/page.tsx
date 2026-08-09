import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getProfitAndLoss(from?: string, to?: string, warehouseId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (warehouseId) query.set('warehouseId', warehouseId);
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/profit-loss?${query.toString()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
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

export default async function ProfitAndLossPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; warehouseId?: string }> }) {
  const resolvedParams = await searchParams;
  const [pl, settings, warehouseName] = await Promise.all([
    getProfitAndLoss(resolvedParams.from, resolvedParams.to, resolvedParams.warehouseId),
    getCompanySettings(),
    getWarehouseName(resolvedParams.warehouseId),
  ]);

  const dateRangeLabel = [
    resolvedParams.from || resolvedParams.to ? `${resolvedParams.from || 'Start'} – ${resolvedParams.to || 'Today'}` : undefined,
    warehouseName ? `Outlet: ${warehouseName}` : undefined,
  ].filter(Boolean).join(' — ') || undefined;
  const accent = settings?.reportAccentColor || '0D9488';

  const incomeRows = (pl?.incomeLines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.amount }));
  const expenseRows = (pl?.expenseLines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.amount }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/accounting/reports" className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Reports</Link>
        <PrintButton />
      </div>
      <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Profit & Loss" subtitle={dateRangeLabel} accentColor={accent} />
        <TabularReportView settings={settings} reportKey="profitAndLoss" title="" hideLetterhead sectionLabel="Income" rows={incomeRows} totals={{ amount: pl?.totalIncome || 0 }} />
        <TabularReportView settings={settings} reportKey="profitAndLoss" title="" hideLetterhead sectionLabel="Expenses" rows={expenseRows} totals={{ amount: pl?.totalExpense || 0 }} />
        <div className="flex justify-between items-center mt-8 pt-4 border-t-2 border-gray-800">
          <span className="font-black text-gray-900">Net Profit</span>
          <span className="font-black" style={{ color: `#${accent}` }}>{formatQAR(pl?.netProfit || 0)}</span>
        </div>
      </div>
    </div>
  );
}
