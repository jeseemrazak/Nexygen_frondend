import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import PrintButton from '@/components/print/PrintButton';

async function getEntry(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries/${id}`, {
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

export default async function JournalEntryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [entry, settings] = await Promise.all([getEntry(resolvedParams.id), getCompanySettings()]);
  if (!entry) return <div className="p-8 text-center text-rose-500 font-bold">Journal entry not found.</div>;

  const accent = settings?.reportAccentColor || '0D9488';
  const headerColor = settings?.reportHeaderColor || 'E0E0E0';
  const totalDebit = entry.lines.reduce((s: number, l: any) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s: number, l: any) => s + l.credit, 0);

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-3xl mx-auto">
        <Link href={`/dashboard/accounting/journal/${resolvedParams.id}`} className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to Entry</Link>
        <PrintButton />
      </div>

      <div className="print-area bg-white p-10 max-w-3xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="Journal Voucher" subtitle={`Entry #${entry.id}`} accentColor={accent} />

        <div className="flex justify-between items-start mb-6 text-sm">
          <div className="space-y-0.5">
            <p><span className="text-gray-500">Source: </span><span className="font-bold">{entry.sourceType}</span></p>
            {entry.memo && <p><span className="text-gray-500">Memo: </span><span className="font-bold">{entry.memo}</span></p>}
          </div>
          <div className="text-right space-y-0.5">
            <p><span className="text-gray-500">Date: </span><span className="font-bold">{formatDate(entry.date)}</span></p>
            {entry.voidedAt && <p className="font-black text-rose-600">VOIDED {formatDate(entry.voidedAt)}</p>}
            {entry.reversalOfId && <p className="font-black" style={{ color: `#${accent}` }}>REVERSAL</p>}
          </div>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr style={{ backgroundColor: `#${headerColor}` }}>
              <th className="py-2 px-3">Account</th>
              <th className="py-2 px-3">Description</th>
              <th className="py-2 px-3 text-right">Debit</th>
              <th className="py-2 px-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((line: any) => (
              <tr key={line.id} className="border-b border-gray-200">
                <td className="py-2 px-3">{line.account.code} - {line.account.name}</td>
                <td className="py-2 px-3">{line.description || '--'}</td>
                <td className="py-2 px-3 text-right">{line.debit > 0 ? formatQAR(line.debit) : ''}</td>
                <td className="py-2 px-3 text-right">{line.credit > 0 ? formatQAR(line.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td className="py-2 px-3 font-black" colSpan={2}>Total</td>
              <td className="py-2 px-3 text-right font-black">{formatQAR(totalDebit)}</td>
              <td className="py-2 px-3 text-right font-black">{formatQAR(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
          <div className="pt-8 border-t border-gray-400">Prepared By</div>
          <div className="pt-8 border-t border-gray-400">Approved By</div>
        </div>
      </div>
    </div>
  );
}
