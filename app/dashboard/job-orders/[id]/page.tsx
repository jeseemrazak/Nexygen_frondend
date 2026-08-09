'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);
const formatDateTime = (d: string) => new Date(d).toLocaleString('en-QA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function JobOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [jobOrder, setJobOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [partProductId, setPartProductId] = useState('');
  const [partBatch, setPartBatch] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [addingPart, setAddingPart] = useState(false);

  const [laborDescription, setLaborDescription] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [laborRate, setLaborRate] = useState('');
  const [laborAmount, setLaborAmount] = useState('');
  const [addingLabor, setAddingLabor] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const [joRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/job-orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (joRes.ok) setJobOrder(await joRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      setLoading(false);
    };
    load();
  }, [id]);

  const isMutable = jobOrder && jobOrder.status !== 'COMPLETED' && jobOrder.status !== 'CANCELLED';

  const selectedProduct = products.find((p: any) => String(p.id) === partProductId);
  const availableBatches = selectedProduct
    ? (selectedProduct.inventories || []).filter((inv: any) => inv.warehouseId === jobOrder?.warehouseId && inv.quantity > 0)
    : [];

  const handleAddPart = async () => {
    if (!partProductId || !partQty) return;
    const isService = selectedProduct?.type === 'SERVICE';
    if (!isService && !partBatch) return setError('Select a batch for this part.');
    setAddingPart(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: Number(partProductId), quantity: Number(partQty), batchNumber: isService ? 'SERVICE' : partBatch }),
    });
    if (res.ok) {
      setJobOrder(await res.json());
      setPartProductId(''); setPartBatch(''); setPartQty('1');
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to add part.');
    }
    setAddingPart(false);
  };

  const handleRemovePart = async (partId: number) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/parts/${partId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobOrder(await res.json());
  };

  const handleAddLabor = async () => {
    const computedAmount = laborHours && laborRate ? Number(laborHours) * Number(laborRate) : Number(laborAmount);
    if (!laborDescription.trim() || !computedAmount) return;
    setAddingLabor(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/labor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        description: laborDescription,
        hours: laborHours ? Number(laborHours) : undefined,
        rate: laborRate ? Number(laborRate) : undefined,
        amount: computedAmount,
      }),
    });
    if (res.ok) {
      setJobOrder(await res.json());
      setLaborDescription(''); setLaborHours(''); setLaborRate(''); setLaborAmount('');
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to add labor line.');
    }
    setAddingLabor(false);
  };

  const handleRemoveLabor = async (laborId: number) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/labor/${laborId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobOrder(await res.json());
  };

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setJobOrder(await res.json());
    } else {
      const err = await safeJson(res);
      setError(err?.message || 'Failed to update status.');
    }
    setStatusUpdating(false);
  };

  if (loading) return <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">Loading...</div>;
  if (!jobOrder) return <div className="p-8 text-center text-rose-500 font-bold">Job Order not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/job-orders" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">← Back to Job Orders</Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-mono">{jobOrder.jobNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              <Link href={`/dashboard/vehicles/${jobOrder.vehicleId}`} className="font-mono text-purple-700 hover:underline">{jobOrder.vehicle?.plateNumber}</Link>
              {jobOrder.customer && <> · {jobOrder.customer.name}</>}
              {jobOrder.technician && <> · Tech: {jobOrder.technician.name}</>}
            </p>
            <p className="text-xs text-gray-400 mt-1">Opened {formatDateTime(jobOrder.createdAt)}{jobOrder.completedAt && <> · Completed {formatDateTime(jobOrder.completedAt)}</>}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[jobOrder.status]}`}>{jobOrder.status.replace('_', ' ')}</span>
        </div>
        {jobOrder.description && <p className="text-sm text-gray-600 mt-3 border-t border-gray-100 pt-3">{jobOrder.description}</p>}

        <div className="flex gap-3 mt-4">
          {jobOrder.status === 'OPEN' && (
            <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={statusUpdating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-sm disabled:opacity-50">
              Start Work
            </button>
          )}
          {jobOrder.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusChange('COMPLETED')} disabled={statusUpdating} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-md text-sm disabled:opacity-50">
              Mark Completed
            </button>
          )}
          {isMutable && (
            <button onClick={() => handleStatusChange('CANCELLED')} disabled={statusUpdating} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2 rounded-md text-sm disabled:opacity-50">
              Cancel Job Order
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-rose-50 text-rose-700 text-sm font-semibold px-4 py-3 rounded-lg">{error}</div>}

      {/* PARTS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Parts</h2>
        </div>
        {jobOrder.parts.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase">Batch</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Qty</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Unit Price</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                {isMutable && <th className="py-2 px-6"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {jobOrder.parts.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-2 px-6 text-sm font-semibold">{p.product?.name}</td>
                  <td className="py-2 px-6 text-sm font-mono text-gray-500">{p.batchNumber}</td>
                  <td className="py-2 px-6 text-sm text-right">{p.quantity}</td>
                  <td className="py-2 px-6 text-sm text-right">{formatQAR(p.unitPrice)}</td>
                  <td className="py-2 px-6 text-sm font-bold text-right">{formatQAR(p.quantity * p.unitPrice)}</td>
                  {isMutable && (
                    <td className="py-2 px-6 text-right">
                      <button onClick={() => handleRemovePart(p.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {isMutable && (
          <div className="p-6 border-t border-gray-100 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Product</label>
              <select value={partProductId} onChange={(e) => { setPartProductId(e.target.value); setPartBatch(''); }} className="w-full border border-gray-300 rounded-md p-2 text-black bg-white text-sm">
                <option value="">Select product...</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {selectedProduct?.type !== 'SERVICE' && (
              <div className="min-w-[160px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Batch</label>
                <select value={partBatch} onChange={(e) => setPartBatch(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black bg-white text-sm">
                  <option value="">Select batch...</option>
                  {availableBatches.map((inv: any) => <option key={inv.id} value={inv.batchNumber}>{inv.batchNumber} (Qty: {inv.quantity})</option>)}
                </select>
              </div>
            )}
            <div className="w-24">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Qty</label>
              <input type="number" min={1} value={partQty} onChange={(e) => setPartQty(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
            </div>
            <button onClick={handleAddPart} disabled={addingPart || !partProductId} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-md text-sm shadow-sm disabled:bg-gray-300">
              {addingPart ? 'Adding...' : 'Add Part'}
            </button>
          </div>
        )}
      </div>

      {/* LABOR */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Labor</h2>
        </div>
        {jobOrder.laborLines.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Hours</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Rate</th>
                <th className="py-2 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                {isMutable && <th className="py-2 px-6"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {jobOrder.laborLines.map((l: any) => (
                <tr key={l.id}>
                  <td className="py-2 px-6 text-sm font-semibold">{l.description}</td>
                  <td className="py-2 px-6 text-sm text-right">{l.hours ?? '--'}</td>
                  <td className="py-2 px-6 text-sm text-right">{l.rate != null ? formatQAR(l.rate) : '--'}</td>
                  <td className="py-2 px-6 text-sm font-bold text-right">{formatQAR(l.amount)}</td>
                  {isMutable && (
                    <td className="py-2 px-6 text-right">
                      <button onClick={() => handleRemoveLabor(l.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {isMutable && (
          <div className="p-6 border-t border-gray-100 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
              <input value={laborDescription} onChange={(e) => setLaborDescription(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
            </div>
            <div className="w-20">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hours</label>
              <input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Rate</label>
              <input type="number" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Or Flat Amount</label>
              <input type="number" value={laborAmount} onChange={(e) => setLaborAmount(e.target.value)} placeholder="QAR" className="w-full border border-gray-300 rounded-md p-2 text-black text-sm" />
            </div>
            <button onClick={handleAddLabor} disabled={addingLabor || !laborDescription} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-md text-sm shadow-sm disabled:bg-gray-300">
              {addingLabor ? 'Adding...' : 'Add Labor'}
            </button>
          </div>
        )}
      </div>

      {/* TOTALS */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Parts Total</span>
          <span>{formatQAR(jobOrder.partsTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Labor Total</span>
          <span>{formatQAR(jobOrder.laborTotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-100 mt-2">
          <span>Total</span>
          <span className="text-purple-700">{formatQAR(jobOrder.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
