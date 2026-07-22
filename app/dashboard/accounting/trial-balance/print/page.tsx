import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getTrialBalance(asOf?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/trial-balance${asOf ? `?asOf=${asOf}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { rows: [], grandTotalDebit: 0, grandTotalCredit: 0 };
    return await res.json();
  } catch {
    return { rows: [], grandTotalDebit: 0, grandTotalCredit: 0 };
  }
}

export default async function TrialBalancePrintPage({ searchParams }: { searchParams: Promise<{ asOf?: string }> }) {
  const resolvedParams = await searchParams;
  const [data, settings] = await Promise.all([getTrialBalance(resolvedParams.asOf), getCompanySettings()]);

  const rows = data.rows.map((r: any) => ({
    code: r.account.code,
    name: r.account.name,
    type: r.account.type,
    subtype: r.account.subtype || '',
    debit: r.totalDebit,
    credit: r.totalCredit,
    balance: r.balance,
  }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link href="/dashboard/accounting/trial-balance" className="text-teal-600 hover:text-teal-800 text-sm font-bold">← Back to Trial Balance</Link>
        <PrintButton />
      </div>
      <TabularReportView
        settings={settings}
        reportKey="trialBalance"
        title="Trial Balance"
        dateRangeLabel={resolvedParams.asOf ? `As of ${resolvedParams.asOf}` : undefined}
        rows={rows}
        totals={{ debit: data.grandTotalDebit, credit: data.grandTotalCredit, balance: data.grandTotalDebit - data.grandTotalCredit }}
      />
    </div>
  );
}
