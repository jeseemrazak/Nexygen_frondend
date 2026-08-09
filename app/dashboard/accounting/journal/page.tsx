'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const SOURCE_TYPES = ['MANUAL', 'SALES_INVOICE', 'SALES_PAYMENT', 'PURCHASE_INVOICE', 'PURCHASE_PAYMENT'];

export default function JournalEntriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <JournalEntriesPageInner />
    </Suspense>
  );
}

function JournalEntriesPageInner() {
  const searchParams = useSearchParams();
  const journalIdParam = searchParams.get('journalId') || '';
  const journalNameParam = searchParams.get('journalName') || '';

  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<any[]>([
    { accountId: '', debit: '', credit: '', description: '', costCenterId: '' },
    { accountId: '', debit: '', credit: '', description: '', costCenterId: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [filters, setFilters] = useState({ from: '', to: '', accountId: '', sourceType: '', search: '' });

  useEffect(() => {
    fetchAccounts();
    fetchCostCenters();
  }, []);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, journalIdParam]);

  const fetchAccounts = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/accounts?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setAccounts(await res.json());
  };

  const fetchCostCenters = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setCostCenters(await res.json());
  };

  const fetchEntries = async () => {
    setLoading(true);
    const token = getClientToken();
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.sourceType) params.set('sourceType', filters.sourceType);
    if (filters.search) params.set('search', filters.search);
    if (journalIdParam) params.set('journalId', journalIdParam);

    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = lines.length > 0 && totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.001;

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setErrorMessage('Debits and credits must balance before saving.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    const token = getClientToken();

    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        memo: memo || undefined,
        lines: lines
          .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
          .map((l) => ({
            accountId: Number(l.accountId),
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            description: l.description || undefined,
            costCenterId: l.costCenterId ? Number(l.costCenterId) : undefined,
          })),
      }),
    });

    if (res.ok) {
      setMemo('');
      setLines([
        { accountId: '', debit: '', credit: '', description: '' },
        { accountId: '', debit: '', credit: '', description: '' },
      ]);
      fetchEntries();
    } else {
      const err = await res.json();
      setErrorMessage(err.message || 'Failed to save journal entry.');
    }
    setIsSubmitting(false);
  };

  const exportCsv = () => {
    const rows: any[] = [];
    for (const entry of entries) {
      for (const line of entry.lines) {
        rows.push({
          'Entry ID': entry.id,
          'Date': formatDateTime(entry.date),
          'Source': entry.sourceType,
          'Memo': entry.memo || '',
          'Status': entry.voidedAt ? 'VOIDED' : entry.reversalOfId ? 'REVERSAL' : 'POSTED',
          'Account Code': line.account.code,
          'Account Name': line.account.name,
          'Debit': line.debit || 0,
          'Credit': line.credit || 0,
        });
      }
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal');
    XLSX.writeFile(workbook, `Journal_Entries.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Journal Entries</h1>
        <p className="text-sm text-gray-500 mt-1">Every posting — automatic or manual — lives here.</p>
        {journalIdParam && (
          <div className="mt-3 inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-bold px-3 py-1.5 rounded-full">
            Filtered to journal: {journalNameParam || `#${journalIdParam}`}
            <Link href="/dashboard/accounting/journal" className="text-teal-500 hover:text-teal-800">✕</Link>
          </div>
        )}
      </div>

      {/* MANUAL ENTRY BUILDER */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">➕ New Manual Entry</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Memo</label>
            <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. Office rent for July" className="w-full max-w-lg border border-gray-300 rounded-md px-4 py-2 text-black" />
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-2 pr-2">Account</th>
                <th className="py-2 pr-2">Description</th>
                <th className="py-2 pr-2 w-32">Debit</th>
                <th className="py-2 pr-2 w-32">Credit</th>
                <th className="py-2 pr-2 w-36">Cost Center</th>
                <th className="py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className="py-1 pr-2">
                    <select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-black bg-white text-sm">
                      <option value="">Select account...</option>
                      {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <input type="text" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-black text-sm" />
                  </td>
                  <td className="py-1 pr-2">
                    <input type="number" min="0" step="0.01" value={line.debit} onChange={(e) => updateLine(index, 'debit', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-black text-sm" />
                  </td>
                  <td className="py-1 pr-2">
                    <input type="number" min="0" step="0.01" value={line.credit} onChange={(e) => updateLine(index, 'credit', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-black text-sm" />
                  </td>
                  <td className="py-1 pr-2">
                    <select value={line.costCenterId} onChange={(e) => updateLine(index, 'costCenterId', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-black bg-white text-sm">
                      <option value="">--</option>
                      {costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.code}</option>)}
                    </select>
                  </td>
                  <td className="py-1">
                    {lines.length > 2 && (
                      <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" onClick={() => setLines([...lines, { accountId: '', debit: '', credit: '', description: '', costCenterId: '' }])} className="text-teal-600 text-sm font-bold hover:underline">
            + Add Line
          </button>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className={`text-sm font-bold ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
              Debits: {formatQAR(totalDebit)} | Credits: {formatQAR(totalCredit)} {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
            </div>
            <button type="submit" disabled={isSubmitting || !isBalanced} className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-md transition disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : 'Post Entry'}
            </button>
          </div>
          {errorMessage && <p className="text-rose-600 text-sm font-semibold">{errorMessage}</p>}
        </form>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account</label>
            <select value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
              <option value="">All accounts</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source</label>
            <select value={filters.sourceType} onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
              <option value="">All sources</option>
              {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search memo</label>
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black" />
          </div>
          <button
            onClick={() => setFilters({ from: '', to: '', accountId: '', sourceType: '', search: '' })}
            className="text-gray-500 text-sm font-bold hover:underline pb-2"
          >
            Reset
          </button>
          <button
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:bg-gray-300"
          >
            📊 Export
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No journal entries match these filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry: any) => (
              <Link key={entry.id} href={`/dashboard/accounting/journal/${entry.id}`} className="block p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{entry.memo || `${entry.sourceType} entry`}</span>
                    <span className="text-xs font-bold uppercase text-slate-400">{entry.sourceType}</span>
                    {entry.voidedAt && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700">Voided</span>
                    )}
                    {entry.reversalOfId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700">Reversal</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDateTime(entry.date)}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {entry.lines.map((line: any) => (
                      <tr key={line.id} className="text-gray-600">
                        <td className="py-1 pl-4">{line.account.code} - {line.account.name}</td>
                        <td className="py-1 text-right w-28">{line.debit > 0 ? formatQAR(line.debit) : ''}</td>
                        <td className="py-1 text-right w-28">{line.credit > 0 ? formatQAR(line.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
