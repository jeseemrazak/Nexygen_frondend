'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function JournalEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntry = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) setEntry(await res.json());
    setLoading(false);
  };

  const handleVoid = async () => {
    if (!confirm('Void this entry? This posts an offsetting reversal — the original stays on record for audit purposes.')) return;
    setError('');
    setIsVoiding(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries/${params.id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    if (res.ok) {
      const reversal = await res.json();
      router.push(`/dashboard/accounting/journal/${reversal.id}`);
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to void entry.');
      setIsVoiding(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Entry...</div>;
  if (!entry) return <div className="p-8 text-center text-rose-500 font-bold">Journal entry not found.</div>;

  const totalDebit = entry.lines.reduce((s: number, l: any) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s: number, l: any) => s + l.credit, 0);
  const canVoid = !entry.voidedAt && !entry.reversalOfId;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 font-sans">

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start gap-4">
          <Link href="/dashboard/accounting/journal" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Journal
          </Link>
          <a
            href={`/dashboard/accounting/journal/${entry.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-md text-xs whitespace-nowrap"
          >
            🖨️ Print
          </a>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
          Entry #{entry.id}
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">{entry.sourceType}</span>
          {entry.voidedAt && (
            <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">VOIDED {formatDateTime(entry.voidedAt)}</span>
          )}
          {entry.reversalOfId && (
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">REVERSAL</span>
          )}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <p className="text-slate-600 font-medium">📅 {formatDateTime(entry.date)}</p>
          {entry.memo && <p className="text-slate-600 font-medium">📝 {entry.memo}</p>}
          {entry.reversalOf && (
            <p className="text-slate-600 font-medium">
              ↩ Reverses <Link href={`/dashboard/accounting/journal/${entry.reversalOf.id}`} className="text-teal-600 hover:underline font-bold">Entry #{entry.reversalOf.id}</Link>
            </p>
          )}
          {entry.reversedBy && (
            <p className="text-slate-600 font-medium">
              ↪ Reversed by <Link href={`/dashboard/accounting/journal/${entry.reversedBy.id}`} className="text-teal-600 hover:underline font-bold">Entry #{entry.reversedBy.id}</Link>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800">Lines</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <th className="py-3 px-6">Account</th>
              <th className="py-3 px-6">Description</th>
              <th className="py-3 px-6 text-right">Debit</th>
              <th className="py-3 px-6 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entry.lines.map((line: any) => (
              <tr key={line.id}>
                <td className="py-3 px-6 font-bold text-slate-800">{line.account.code} - {line.account.name}</td>
                <td className="py-3 px-6 text-slate-500">{line.description || '--'}</td>
                <td className="py-3 px-6 text-right">{line.debit > 0 ? formatQAR(line.debit) : ''}</td>
                <td className="py-3 px-6 text-right">{line.credit > 0 ? formatQAR(line.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan={2} className="py-3 px-6 text-right font-black text-slate-800">Total</td>
              <td className="py-3 px-6 text-right font-black text-slate-800">{formatQAR(totalDebit)}</td>
              <td className="py-3 px-6 text-right font-black text-slate-800">{formatQAR(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {canVoid && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3">
          <h2 className="text-lg font-extrabold text-slate-800">Void This Entry</h2>
          <p className="text-sm text-slate-500">Posts an offsetting reversal entry. The original stays on record — nothing is edited or deleted.</p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm text-black"
          />
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
          <button
            onClick={handleVoid}
            disabled={isVoiding}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm disabled:opacity-50"
          >
            {isVoiding ? 'Voiding...' : 'Void Entry'}
          </button>
        </div>
      )}
    </div>
  );
}
