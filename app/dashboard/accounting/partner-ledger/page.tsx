'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function PartnerLedgerPage() {
  const [partyType, setPartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [partyName, setPartyName] = useState('');
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSuppliers = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSuppliers(await res.json());
    };
    const loadCustomers = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    };
    loadSuppliers();
    loadCustomers();
  }, []);

  const handlePartyTypeChange = (type: 'CUSTOMER' | 'SUPPLIER') => {
    setPartyType(type);
    setPartyName('');
    setLedger(null);
  };

  const loadLedger = async (name: string) => {
    if (!name.trim()) {
      setLedger(null);
      return;
    }
    setLoading(true);
    const token = getClientToken();
    const res = await fetch(
      `${API_BASE_URL}/accounting/partner-ledger?partyType=${partyType}&partyName=${encodeURIComponent(name)}`,
      { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' },
    );
    if (res.ok) setLedger(await res.json());
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Partner Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">One customer's or supplier's full history against Accounts Receivable/Payable, with a running balance.</p>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => handlePartyTypeChange('CUSTOMER')}
            className={`px-4 py-2 rounded-md text-sm font-bold ${partyType === 'CUSTOMER' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => handlePartyTypeChange('SUPPLIER')}
            className={`px-4 py-2 rounded-md text-sm font-bold ${partyType === 'SUPPLIER' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Supplier
          </button>
        </div>

        <div className="mt-4 flex gap-3 max-w-lg">
          {partyType === 'CUSTOMER' ? (
            <select
              value={partyName}
              onChange={(e) => { setPartyName(e.target.value); loadLedger(e.target.value); }}
              className="flex-1 border border-gray-300 rounded-md p-3 text-black bg-white"
            >
              <option value="">Select customer...</option>
              {customers.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          ) : (
            <select
              value={partyName}
              onChange={(e) => { setPartyName(e.target.value); loadLedger(e.target.value); }}
              className="flex-1 border border-gray-300 rounded-md p-3 text-black bg-white"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}

      {!loading && ledger && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">{ledger.partyName}</h2>
            <div className="flex items-center gap-4">
              <span className="font-bold text-teal-700">Ending balance: {formatQAR(ledger.endingBalance)}</span>
              <a
                href={`/dashboard/accounting/partner-ledger/print?partyType=${partyType}&partyName=${encodeURIComponent(partyName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-md text-xs whitespace-nowrap"
              >
                🖨️ Print
              </a>
            </div>
          </div>
          {ledger.lines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No postings for this {partyType === 'CUSTOMER' ? 'customer' : 'supplier'} yet.</div>
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
