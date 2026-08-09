import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getCashFlow(from?: string, to?: string) {
  if (!from || !to) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/cash-flow?from=${from}&to=${to}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export default async function CashFlowPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const resolvedParams = await searchParams;
  const [cf, settings] = await Promise.all([getCashFlow(resolvedParams.from, resolvedParams.to), getCompanySettings()]);

  const accent = settings?.reportAccentColor || '0D9488';
  const toRows = (lines: any[]) => (lines || []).map((l: any) => ({ code: l.account.code, name: l.account.name, amount: l.cashImpact }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/accounting/reports" className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Reports</Link>
        <PrintButton />
      </div>
      <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Cash Flow Statement" subtitle={resolvedParams.from && resolvedParams.to ? `${resolvedParams.from} to ${resolvedParams.to}` : undefined} accentColor={accent} />
        {!cf ? (
          <p className="text-center text-gray-400 py-8 text-sm">Select a From/To date range to generate this statement.</p>
        ) : (
          <>
            <div className="flex justify-between text-sm font-bold py-2">
              <span>Net Income (for period)</span>
              <span>{formatQAR(cf.netProfit)}</span>
            </div>
            <TabularReportView settings={settings} reportKey="cashFlowStatement" title="" hideLetterhead sectionLabel="Operating Activities (working-capital changes)" rows={toRows(cf.operatingLines)} totals={{ amount: cf.netCashFromOperating - cf.netProfit }} />
            <div className="flex justify-between text-sm font-black py-2 border-t border-gray-200">
              <span>Net Cash from Operating Activities</span>
              <span>{formatQAR(cf.netCashFromOperating)}</span>
            </div>
            <TabularReportView settings={settings} reportKey="cashFlowStatement" title="" hideLetterhead sectionLabel="Investing Activities" rows={toRows(cf.investingLines)} totals={{ amount: cf.netCashFromInvesting }} />
            <TabularReportView settings={settings} reportKey="cashFlowStatement" title="" hideLetterhead sectionLabel="Financing Activities" rows={toRows(cf.financingLines)} totals={{ amount: cf.netCashFromFinancing }} />
            <div className="flex justify-between items-center mt-8 pt-4 border-t-2 border-gray-800">
              <span className="font-black text-gray-900">Net Change in Cash</span>
              <span className="font-black" style={{ color: `#${accent}` }}>{formatQAR(cf.netChangeInCash)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 py-1">
              <span>Opening Cash &amp; Bank</span><span>{formatQAR(cf.openingCash)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 py-1">
              <span>Closing Cash &amp; Bank</span><span>{formatQAR(cf.closingCash)}</span>
            </div>
            <div className={`flex justify-between text-xs font-bold py-1 ${cf.reconciles ? 'text-purple-600' : 'text-rose-600'}`}>
              <span>{cf.reconciles ? '✓ Reconciles to actual cash movement' : '✗ Does not reconcile — check data'}</span>
              <span>{formatQAR(cf.actualCashMovement)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
