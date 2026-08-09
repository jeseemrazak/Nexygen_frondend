import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import TabularReportView from '@/components/print/TabularReportView';
import PrintButton from '@/components/print/PrintButton';

async function getPartnerLedger(partyType: string, partyName: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/partner-ledger?partyType=${partyType}&partyName=${encodeURIComponent(partyName)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function PartnerLedgerPrintPage({ searchParams }: { searchParams: Promise<{ partyType?: string; partyName?: string }> }) {
  const resolvedParams = await searchParams;
  if (!resolvedParams.partyType || !resolvedParams.partyName) {
    return <div className="p-8 text-center text-rose-500 font-bold">No party selected.</div>;
  }

  const [ledger, settings] = await Promise.all([getPartnerLedger(resolvedParams.partyType, resolvedParams.partyName), getCompanySettings()]);
  if (!ledger) return <div className="p-8 text-center text-rose-500 font-bold">Partner ledger not found.</div>;

  const rows = ledger.lines.map((line: any) => ({
    date: formatDate(line.journalEntry.date),
    entryNo: line.journalEntry.id,
    description: line.description || line.journalEntry.memo || line.journalEntry.sourceType,
    sourceType: line.journalEntry.sourceType,
    debit: line.debit,
    credit: line.credit,
    balance: line.runningBalance,
  }));

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link
          href={`/dashboard/accounting/partner-ledger?partyType=${resolvedParams.partyType}&partyName=${encodeURIComponent(resolvedParams.partyName)}`}
          className="text-purple-600 hover:text-purple-800 text-sm font-bold"
        >
          ← Back to Partner Ledger
        </Link>
        <PrintButton />
      </div>
      <TabularReportView
        settings={settings}
        reportKey="partnerLedger"
        title={`${resolvedParams.partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'}: ${resolvedParams.partyName}`}
        dateRangeLabel={`Ending balance: ${new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(ledger.endingBalance)}`}
        rows={rows}
        totals={{ balance: ledger.endingBalance }}
      />
    </div>
  );
}
