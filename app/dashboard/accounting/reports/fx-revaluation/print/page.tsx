import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { getCompanySettings } from '@/lib/companySettings';
import Letterhead from '@/components/print/Letterhead';
import PrintButton from '@/components/print/PrintButton';

async function getFxRevaluation() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/reports/fx-revaluation`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export default async function FxRevaluationPrintPage() {
  const [data, settings] = await Promise.all([getFxRevaluation(), getCompanySettings()]);
  const accent = settings?.reportAccentColor || '0D9488';

  return (
    <div>
      <div className="no-print flex justify-between items-center p-4 max-w-5xl mx-auto">
        <Link href="/dashboard/accounting/reports/fx-revaluation" className="text-purple-600 hover:text-purple-800 text-sm font-bold">← Back to FX Revaluation</Link>
        <PrintButton />
      </div>
      <div className="print-area print-landscape bg-white p-10 max-w-5xl mx-auto text-gray-900">
        <Letterhead settings={settings} title="FX Revaluation" subtitle="Unrealized gain/loss on open foreign-currency balances" accentColor={accent} />
        {!data || data.rows.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No open foreign-currency Invoices or Bills.</p>
        ) : (
          <>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: '#E0E0E0' }}>
                  <th className="border border-gray-300 p-2 font-bold">Document</th>
                  <th className="border border-gray-300 p-2 font-bold">Type</th>
                  <th className="border border-gray-300 p-2 font-bold">Party</th>
                  <th className="border border-gray-300 p-2 font-bold">Currency</th>
                  <th className="border border-gray-300 p-2 font-bold text-right">Outstanding (QAR)</th>
                  <th className="border border-gray-300 p-2 font-bold text-right">Revalued (QAR)</th>
                  <th className="border border-gray-300 p-2 font-bold text-right">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r: any) => (
                  <tr key={`${r.type}-${r.documentId}`}>
                    <td className="border border-gray-200 p-2 font-mono">{r.documentNumber || `#${r.documentId}`}</td>
                    <td className="border border-gray-200 p-2">{r.type}</td>
                    <td className="border border-gray-200 p-2">{r.party}</td>
                    <td className="border border-gray-200 p-2 font-mono">{r.currency.code}</td>
                    <td className="border border-gray-200 p-2 text-right">{formatQAR(r.outstandingQAR)}</td>
                    <td className="border border-gray-200 p-2 text-right">{formatQAR(r.revaluedQAR)}</td>
                    <td className="border border-gray-200 p-2 text-right font-bold">{formatQAR(r.gainLoss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-8 pt-4 border-t-2 border-gray-800">
              <span className="font-black text-gray-900">Net Unrealized Gain/Loss</span>
              <span className="font-black" style={{ color: `#${accent}` }}>{formatQAR(data.netGainLoss)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
