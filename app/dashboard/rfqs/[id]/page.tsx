'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function RfqDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState('');

  const [convertingId, setConvertingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRfq();
    fetchSuppliers();
  }, []);

  const fetchRfq = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/rfqs/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setRfq(await res.json());
    } catch (error) {
      console.error('Failed to load RFQ');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setSuppliers(await res.json());
  };

  const handleRecordResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const items = rfq.items.map((item: any) => ({
      productId: item.productId,
      unitCost: Number(costs[item.id] || 0),
    }));
    if (items.some((i: any) => !i.unitCost || i.unitCost <= 0)) {
      setResponseError('Enter a unit cost for every line item.');
      return;
    }

    setIsSubmittingResponse(true);
    setResponseError('');
    const token = getClientToken();

    const res = await fetch(`${API_BASE_URL}/rfqs/${params.id}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ supplierId: Number(selectedSupplier), items }),
    });

    if (res.ok) {
      setSelectedSupplier('');
      setCosts({});
      fetchRfq();
    } else {
      const err = await safeJson(res);
      setResponseError(err?.message || 'Failed to record response.');
    }
    setIsSubmittingResponse(false);
  };

  const handleConvert = async (responseId: number) => {
    if (!confirm('Convert this supplier\'s response into a Purchase Order? The other responses will be rejected.')) return;
    setConvertingId(responseId);
    const token = getClientToken();

    const res = await fetch(`${API_BASE_URL}/rfqs/${params.id}/responses/${responseId}/convert-to-po`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      const updated = await res.json();
      const winning = updated.responses.find((r: any) => r.id === responseId);
      router.push(`/dashboard/purchases/${winning.convertedPurchaseOrderId}`);
    } else {
      const err = await safeJson(res);
      alert(`Error: ${err?.message || 'Failed to convert response.'}`);
      setConvertingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading RFQ...</div>;
  if (!rfq) return <div className="p-8 text-center text-rose-500 font-bold">RFQ not found.</div>;

  const canRecordResponse = rfq.status !== 'CONVERTED' && rfq.status !== 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 font-sans">

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Link href="/dashboard/rfqs" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
              ← Back to RFQs
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              RFQ-{rfq.id.toString().padStart(4, '0')}
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ring-slate-200">
                {rfq.status}
              </span>
            </h1>
          </div>
          <Link
            href={`/dashboard/rfqs/${rfq.id}/print`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all whitespace-nowrap"
          >
            🖨️ Print
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">📅</span> {formatDateTime(rfq.createdAt)}
          </p>
          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">🏭</span> {rfq.warehouse?.name || 'Unknown Warehouse'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5"><span>📋</span> Requested Items</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <th className="py-4 px-6">Product</th>
              <th className="py-4 px-6 text-center">Qty Needed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rfq.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-4 px-6 font-bold text-slate-800">{item.product?.name}</td>
                <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5"><span>⚖️</span> Supplier Responses</h2>
          <p className="text-sm text-slate-500 mt-1">Sorted cheapest first.</p>
        </div>

        {rfq.responses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No responses recorded yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Supplier</th>
                <th className="py-4 px-6 text-right">Total Quoted</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rfq.responses.map((response: any) => (
                <tr key={response.id} className={response.status === 'SELECTED' ? 'bg-emerald-50/50' : ''}>
                  <td className="py-4 px-6 font-bold text-slate-800">{response.supplier?.name}</td>
                  <td className="py-4 px-6 text-right font-bold">{formatQAR(response.totalAmount)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      response.status === 'SELECTED' ? 'bg-emerald-100 text-emerald-700' :
                      response.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {response.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {response.status === 'SELECTED' && response.convertedPurchaseOrderId ? (
                      <Link href={`/dashboard/purchases/${response.convertedPurchaseOrderId}`} className="text-teal-600 underline text-xs font-bold">
                        View PO
                      </Link>
                    ) : response.status === 'PENDING' && rfq.status !== 'CONVERTED' && rfq.status !== 'CANCELLED' ? (
                      <button
                        onClick={() => handleConvert(response.id)}
                        disabled={convertingId === response.id}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-xs font-bold transition disabled:bg-gray-400"
                      >
                        {convertingId === response.id ? 'Converting...' : 'Convert to PO'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {canRecordResponse && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5"><span>📩</span> Record a Supplier Response</h2>
          </div>
          <form onSubmit={handleRecordResponse} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Supplier <span className="text-red-500">*</span></label>
              <select required value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full max-w-sm border border-slate-300 rounded-md p-3 text-black bg-white">
                <option value="">Select supplier...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              {rfq.items.map((item: any) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b border-slate-100 pb-3">
                  <p className="font-bold text-slate-800">{item.product?.name} <span className="text-slate-400 font-normal">(qty {item.quantity})</span></p>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Cost</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={costs[item.id] || ''}
                      onChange={(e) => setCosts({ ...costs, [item.id]: e.target.value })}
                      className="w-full max-w-xs border border-slate-300 rounded-md p-2 text-black"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>

            {responseError && <p className="text-rose-600 text-sm font-semibold">{responseError}</p>}
            <button type="submit" disabled={isSubmittingResponse} className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-md shadow-sm disabled:bg-gray-400">
              {isSubmittingResponse ? 'Saving...' : 'Save Response'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
