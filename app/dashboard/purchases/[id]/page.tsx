import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { markOrdered, createReceipt, createBill } from './actions';

async function getPurchaseOrder(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

async function getActiveTaxes() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/taxes?activeOnly=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getActiveCostCenters() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/cost-centers?activeOnly=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getActivePaymentTerms() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/payment-terms?activeOnly=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getActiveCurrencies() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/currencies?activeOnly=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const billPaymentBadge: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  UNPAID: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const [po, taxes, costCenters, paymentTerms, currencies] = await Promise.all([getPurchaseOrder(resolvedParams.id), getActiveTaxes(), getActiveCostCenters(), getActivePaymentTerms(), getActiveCurrencies()]);
  const hasError = resolvedSearchParams.error === 'true';

  if (!po) return <div className="p-8 text-center text-rose-500 font-bold">Purchase order not found.</div>;

  const pendingReceiptItems = po.items.filter((i: any) => i.quantityReceived < i.quantityOrdered);
  const pendingBillItems = po.items.filter((i: any) => i.quantityBilled < i.quantityOrdered);
  const canReceive = po.status === 'ORDERED' && pendingReceiptItems.length > 0;
  const canBill = (po.status === 'ORDERED' || po.status === 'RECEIVED') && pendingBillItems.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href="/dashboard/purchases" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Purchase Orders
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            PO-{String(po.id).padStart(4, '0')}
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ring-slate-200">
              {po.status}
            </span>
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">📅</span> {formatDate(po.createdAt)}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏭</span> {po.warehouse?.name || 'Unknown Warehouse'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏢</span> Supplier: <span className="font-bold text-slate-800">{po.supplier?.name || 'Unknown'}</span>
            </p>
            {po.reference && (
              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="text-slate-400">🧾</span> Ref: <span className="font-mono font-bold text-slate-800">{po.reference}</span>
              </p>
            )}
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">💰</span> Total: <span className="font-bold text-slate-800">{formatQAR(po.totalAmount)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-2 md:mt-0">
          <Link
            href={`/dashboard/purchases/${po.id}/print`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all"
          >
            🖨️ Print
          </Link>
          {po.status === 'DRAFT' && (
            <form action={markOrdered}>
              <input type="hidden" name="poId" value={po.id} />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all"
              >
                Mark as Ordered
              </button>
            </form>
          )}
        </div>
      </div>

      {hasError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700 font-medium">Failed to process the request. Check the quantities entered and try again.</p>
        </div>
      )}

      {/* LINE ITEMS / PROGRESS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Line Items
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Ordered</th>
                <th className="py-4 px-6 text-center">Received</th>
                <th className="py-4 px-6 text-center">Billed</th>
                <th className="py-4 px-6 text-right">Unit Cost</th>
                <th className="py-4 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {po.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800">{item.product.name}</p>
                  </td>
                  <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantityOrdered}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-black ${item.quantityReceived >= item.quantityOrdered ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.quantityReceived}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-black ${item.quantityBilled >= item.quantityOrdered ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.quantityBilled}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-slate-600">{formatQAR(item.unitCost)}</td>
                  <td className="py-4 px-6 text-right font-bold">{formatQAR(item.unitCost * item.quantityOrdered)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RECEIPT FORM */}
      {canReceive && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>📥</span> Create Receipt
            </h2>
            <p className="text-sm text-slate-500 mt-1">Record what actually arrived, with the real batch number and expiry date. Leave a row blank to skip it for now.</p>
          </div>

          <form action={createReceipt} className="p-6 space-y-5">
            <input type="hidden" name="poId" value={po.id} />
            {pendingReceiptItems.map((item: any) => {
              const remaining = item.quantityOrdered - item.quantityReceived;
              return (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-slate-100 pb-5 last:border-b-0">
                  <input type="hidden" name="itemIds" value={item.id} />
                  <div>
                    <p className="font-bold text-slate-800">{item.product.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Remaining: {remaining}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty Received</label>
                    <input type="number" name={`qty_${item.id}`} min="0" max={remaining} placeholder="0" className="w-full border border-slate-300 rounded-md p-2 text-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                    <input type="text" name={`batch_${item.id}`} placeholder="Scan or type batch..." className="w-full border border-slate-300 rounded-md p-2 text-black font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry <span className="font-normal text-slate-400">(Optional)</span></label>
                    <input type="date" name={`expiry_${item.id}`} className="w-full border border-slate-300 rounded-md p-2 text-black" />
                  </div>
                </div>
              );
            })}
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md shadow-sm">
              Confirm Receipt
            </button>
          </form>
        </div>
      )}

      {/* CREATE BILL FORM */}
      {canBill && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span>🧾</span> Create Bill
            </h2>
            <p className="text-sm text-slate-500 mt-1">Bill against ordered quantity — independent of what's been received so far.</p>
          </div>

          <form action={createBill} className="p-6 space-y-5">
            <input type="hidden" name="poId" value={po.id} />
            {taxes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax</label>
                <select name="taxId" defaultValue={po.taxId ? String(po.taxId) : ''} className="border border-slate-300 rounded-md p-2 text-sm text-black bg-white">
                  <option value="">No tax</option>
                  {taxes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                  ))}
                </select>
              </div>
            )}
            {costCenters.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cost Center</label>
                <select name="costCenterId" defaultValue={po.costCenterId ? String(po.costCenterId) : ''} className="border border-slate-300 rounded-md p-2 text-sm text-black bg-white">
                  <option value="">-- None --</option>
                  {costCenters.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}
            {paymentTerms.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Term</label>
                <select name="paymentTermId" defaultValue={po.supplier?.paymentTermId ? String(po.supplier.paymentTermId) : ''} className="border border-slate-300 rounded-md p-2 text-sm text-black bg-white">
                  <option value="">No payment term</option>
                  {paymentTerms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.days} days)</option>
                  ))}
                </select>
              </div>
            )}
            {currencies.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Currency</label>
                <select name="currencyId" defaultValue="" className="border border-slate-300 rounded-md p-2 text-sm text-black bg-white">
                  <option value="">QAR only</option>
                  {currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>Quote in {c.code}</option>
                  ))}
                </select>
              </div>
            )}
            {pendingBillItems.map((item: any) => {
              const remaining = item.quantityOrdered - item.quantityBilled;
              return (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-slate-100 pb-5 last:border-b-0">
                  <input type="hidden" name="itemIds" value={item.id} />
                  <div>
                    <p className="font-bold text-slate-800">{item.product.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Remaining: {remaining}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty to Bill</label>
                    <input type="number" name={`billQty_${item.id}`} min="0" max={remaining} placeholder="0" className="w-full border border-slate-300 rounded-md p-2 text-black" />
                  </div>
                </div>
              );
            })}
            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-4 rounded-md shadow-sm">
              Confirm Bill
            </button>
          </form>
        </div>
      )}

      {/* RECEIPTS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📥</span> Receipts
          </h2>
        </div>
        {po.receipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No receipts yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {po.receipts.map((r: any) => (
              <Link
                key={r.id}
                href={`/dashboard/receipts/${r.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-800 font-mono">{r.receiptNumber || `Receipt #${r.id}`}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(r.createdAt)} · {r.items.length} line(s)</p>
                </div>
                <span className="text-slate-400 text-xs">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* BILLS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>🧾</span> Bills
          </h2>
        </div>
        {po.bills.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No bills yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {po.bills.map((b: any) => (
              <Link
                key={b.id}
                href={`/dashboard/bills/${b.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-800 font-mono">{b.billNumber || `Bill #${b.id}`}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(b.createdAt)} · {formatQAR(b.totalAmount)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${billPaymentBadge[b.paymentStatus] || billPaymentBadge.UNPAID}`}>
                  {b.paymentStatus}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
