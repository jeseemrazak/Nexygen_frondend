'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <LedgerContent />
    </Suspense>
  );
}

function LedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountId') || '';

  const [accounts, setAccounts] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/accounts`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setAccounts(await res.json());
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!accountId) {
      setLedger(null);
      return;
    }
    const fetchLedger = async () => {
      setLoading(true);
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/accounting/accounts/${accountId}/ledger`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setLedger(await res.json());
      setLoading(false);
    };
    fetchLedger();
  }, [accountId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">All postings for a single account, with a running balance.</p>
        <select
          value={accountId}
          onChange={(e) => router.push(`/dashboard/accounting/ledger?accountId=${e.target.value}`)}
          className="mt-4 w-full max-w-sm border border-gray-300 rounded-md p-3 text-black bg-white"
        >
          <option value="">Select account...</option>
          {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </select>
      </div>

      {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}

      {!loading && ledger && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">{ledger.account.code} - {ledger.account.name}</h2>
            <div className="flex items-center gap-4">
              <span className="font-bold text-teal-700">Ending balance: {formatQAR(ledger.endingBalance)}</span>
              <a
                href={`/dashboard/accounting/ledger/print?accountId=${accountId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-md text-xs whitespace-nowrap"
              >
                🖨️ Print
              </a>
            </div>
          </div>
          {ledger.lines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No postings for this account yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Debit</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Credit</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-black">
                {ledger.lines.map((line: any) => (
                  <tr key={line.id}>
                    <td className="py-3 px-6 text-sm text-gray-600">{formatDate(line.journalEntry.date)}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{line.description || line.journalEntry.memo || line.journalEntry.sourceType}</td>
                    <td className="py-3 px-6 text-right text-sm">{line.debit > 0 ? formatQAR(line.debit) : ''}</td>
                    <td className="py-3 px-6 text-right text-sm">{line.credit > 0 ? formatQAR(line.credit) : ''}</td>
                    <td className="py-3 px-6 text-right font-bold text-sm">{formatQAR(line.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
