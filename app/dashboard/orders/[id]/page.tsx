'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

const soStatusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const deliveryStatusBadge: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SHIPPED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function SalesOrderDetailsPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merchandisers, setMerchandisers] = useState<any[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [selectedMerchandiser, setSelectedMerchandiser] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const [deliveryQty, setDeliveryQty] = useState<Record<number, string>>({});
  const [deliveryBatch, setDeliveryBatch] = useState<Record<number, string>>({});
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  const [invoiceQty, setInvoiceQty] = useState<Record<number, string>>({});
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [taxes, setTaxes] = useState<any[]>([]);
  const [invoiceTaxId, setInvoiceTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [invoicePaymentTermId, setInvoicePaymentTermId] = useState('');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [invoiceCurrencyId, setInvoiceCurrencyId] = useState('');

  useEffect(() => {
    fetchOrderDetails();
    const token = getClientToken();
    fetch(`${API_BASE_URL}/accounting/taxes?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setTaxes);
    fetch(`${API_BASE_URL}/accounting/payment-terms?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setPaymentTerms);
    fetch(`${API_BASE_URL}/accounting/currencies?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setCurrencies);
  }, []);

  // Default the invoice's tax to whatever tax (if any) the sales order itself was quoted with.
  useEffect(() => {
    if (order?.taxId) setInvoiceTaxId(String(order.taxId));
  }, [order?.taxId]);

  // Default the invoice's payment term to the customer's, if one is set on the order/customer.
  useEffect(() => {
    if (order?.customer?.paymentTermId) setInvoicePaymentTermId(String(order.customer.paymentTermId));
  }, [order?.customer?.paymentTermId]);

  const fetchOrderDetails = async () => {
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/sales-orders/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);

        const [merchRes, whRes] = await Promise.all([
          fetch(`${API_BASE_URL}/orders/merchandisers`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/warehouses/${data.warehouseId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        if (merchRes.ok) setMerchandisers(await merchRes.json());
        if (whRes.ok) {
          const warehouse = await whRes.json();
          setWarehouseInventory(warehouse.inventories || []);
        }
      }
    } catch (error) {
      console.error('Failed to load sales order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;
    setConfirmError('');
    if (!selectedMerchandiser) {
      setConfirmError('Please select a merchandiser.');
      return;
    }

    setIsConfirming(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/sales-orders/${order.id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: Number(selectedMerchandiser) }),
      });
      if (res.ok) {
        await fetchOrderDetails();
      } else {
        const errData = await res.json();
        setConfirmError(errData.message || 'Failed to confirm sales order.');
      }
    } catch (error) {
      setConfirmError('Network error while confirming sales order.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm('Cancel this sales order? This cannot be undone.')) return;
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/sales-orders/${order.id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchOrderDetails();
    } else {
      const errData = await res.json();
      alert(errData.message || 'Failed to cancel sales order.');
    }
  };

  const handleCreateDelivery = async () => {
    if (!order) return;
    setDeliveryError('');

    const items = order.items
      .filter((item: any) => Number(deliveryQty[item.id]) > 0)
      .map((item: any) => ({
        salesOrderItemId: item.id,
        quantity: Number(deliveryQty[item.id]),
        // Services have no batch/warehouse stock to pick from — omitted entirely for them.
        batchNumber: item.product.type === 'SERVICE' ? undefined : deliveryBatch[item.id],
      }));

    if (items.length === 0) {
      setDeliveryError('Enter a quantity for at least one item.');
      return;
    }
    if (items.some((i: any) => order.items.find((oi: any) => oi.id === i.salesOrderItemId)?.product.type !== 'SERVICE' && !i.batchNumber)) {
      setDeliveryError('Select a batch for every line you are delivering.');
      return;
    }

    setIsDelivering(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ salesOrderId: order.id, items }),
      });
      if (res.ok) {
        setDeliveryQty({});
        setDeliveryBatch({});
        await fetchOrderDetails();
      } else {
        const errData = await safeJson(res);
        setDeliveryError(errData?.message || 'Failed to create delivery.');
      }
    } catch (error) {
      setDeliveryError('Network error while creating delivery.');
    } finally {
      setIsDelivering(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!order) return;
    setInvoiceError('');

    const items = order.items
      .filter((item: any) => Number(invoiceQty[item.id]) > 0)
      .map((item: any) => ({
        salesOrderItemId: item.id,
        quantity: Number(invoiceQty[item.id]),
      }));

    if (items.length === 0) {
      setInvoiceError('Enter a quantity for at least one item.');
      return;
    }

    setIsInvoicing(true);
    const token = getClientToken();
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          salesOrderId: order.id,
          taxId: invoiceTaxId ? Number(invoiceTaxId) : undefined,
          paymentTermId: invoicePaymentTermId ? Number(invoicePaymentTermId) : undefined,
          currencyId: invoiceCurrencyId ? Number(invoiceCurrencyId) : undefined,
          items,
        }),
      });
      if (res.ok) {
        setInvoiceQty({});
        await fetchOrderDetails();
      } else {
        const errData = await res.json();
        setInvoiceError(errData.message || 'Failed to create invoice.');
      }
    } catch (error) {
      setInvoiceError('Network error while creating invoice.');
    } finally {
      setIsInvoicing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Sales Order...</div>;
  if (!order) return <div className="p-8 text-center text-rose-500 font-bold">Sales Order not found.</div>;

  const canFulfill = order.status === 'CONFIRMED' || order.status === 'DONE';
  const canCancel = (order.status === 'DRAFT' || order.status === 'CONFIRMED') && order.deliveries.length === 0 && order.invoices.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <Link href="/dashboard/orders" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
            ← Back to Sales Orders
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            Sales Order #{order.id.toString().padStart(4, '0')}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${soStatusBadge[order.status]}`}>
              {order.status}
            </span>
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">📅</span> {formatDateTime(order.createdAt)}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏭</span> {order.warehouse?.name || 'Unknown Warehouse'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">🏢</span> Client: <span className="font-bold text-slate-800">{order.clientName || 'Walk-in'}</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="text-slate-400">💰</span> Total: <span className="font-bold text-slate-800">{formatQAR(order.totalAmount)}</span>
            </p>
            {order.customerReference && (
              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="text-slate-400">🔖</span> Ref: <span className="font-bold text-slate-800">{order.customerReference}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/orders/${order.id}/print`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-lg transition-all"
          >
            🖨️ Print
          </Link>
          {canCancel && (
            <button
              onClick={handleCancel}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-6 rounded-lg border border-rose-200 transition-all"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* MERCHANDISER / CONFIRM CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-[4px] border-l-blue-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm border border-blue-100">
            👤
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Merchandiser</p>
            {order.user ? (
              <p className="text-lg font-bold text-slate-800 mt-0.5">{order.user.name}</p>
            ) : (
              <p className="text-lg font-bold text-amber-600 mt-0.5">Unassigned</p>
            )}
          </div>
        </div>

        {order.status === 'DRAFT' && (
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <label className="block text-sm font-bold text-slate-700">Assign Merchandiser to Confirm</label>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={selectedMerchandiser}
                onChange={(e) => setSelectedMerchandiser(e.target.value)}
                className="border border-slate-300 rounded-md p-3 text-black bg-white min-w-[220px]"
              >
                <option value="">Select merchandiser...</option>
                {merchandisers.map((m: any) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-md shadow-sm disabled:bg-gray-400"
              >
                {isConfirming ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
            {confirmError && <p className="text-rose-600 text-sm font-semibold">{confirmError}</p>}
          </div>
        )}
      </div>

      {/* ITEMS PROGRESS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>📦</span> Order Lines
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6 text-center">Ordered</th>
                <th className="py-4 px-6 text-center">Delivered</th>
                <th className="py-4 px-6 text-center">Invoiced</th>
                {canFulfill && <th className="py-4 px-6">Deliver Now</th>}
                {canFulfill && <th className="py-4 px-6">Invoice Now</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {order.items.map((item: any) => {
                const remainingDelivery = item.quantity - item.quantityDelivered;
                const remainingInvoice = item.quantity - item.quantityInvoiced;
                const availableBatches = warehouseInventory.filter((inv: any) => inv.productId === item.productId && inv.quantity > 0);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.listPrice && item.listPrice !== item.price && (
                          <span className="line-through text-slate-400 mr-1">{formatQAR(item.listPrice)}</span>
                        )}
                        {formatQAR(item.price)} / unit
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-md">{item.quantity}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-black px-3 py-1 rounded-md ${item.quantityDelivered >= item.quantity ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.quantityDelivered}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-black px-3 py-1 rounded-md ${item.quantityInvoiced >= item.quantity ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.quantityInvoiced}
                      </span>
                    </td>

                    {canFulfill && (
                      <td className="py-4 px-6">
                        {remainingDelivery > 0 ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              max={remainingDelivery}
                              placeholder="Qty"
                              value={deliveryQty[item.id] || ''}
                              onChange={(e) => setDeliveryQty({ ...deliveryQty, [item.id]: e.target.value })}
                              className="w-20 border border-slate-300 rounded-md p-2 text-sm"
                            />
                            {item.product.type === 'SERVICE' ? (
                              <span className="text-xs text-slate-400 italic self-center">Service — no batch</span>
                            ) : (
                              <select
                                value={deliveryBatch[item.id] || ''}
                                onChange={(e) => setDeliveryBatch({ ...deliveryBatch, [item.id]: e.target.value })}
                                className="border border-slate-300 rounded-md p-2 text-sm bg-white"
                              >
                                <option value="">Batch...</option>
                                {availableBatches.map((inv: any) => (
                                  <option key={inv.id} value={inv.batchNumber}>
                                    {inv.batchNumber} (Avail: {inv.quantity})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 text-xs font-bold">Fully delivered</span>
                        )}
                      </td>
                    )}

                    {canFulfill && (
                      <td className="py-4 px-6">
                        {remainingInvoice > 0 ? (
                          <input
                            type="number"
                            min="0"
                            max={remainingInvoice}
                            placeholder="Qty"
                            value={invoiceQty[item.id] || ''}
                            onChange={(e) => setInvoiceQty({ ...invoiceQty, [item.id]: e.target.value })}
                            className="w-20 border border-slate-300 rounded-md p-2 text-sm"
                          />
                        ) : (
                          <span className="text-emerald-600 text-xs font-bold">Fully invoiced</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(order.discountType || order.customerReference || order.termsAndConditions) && (
          <div className="px-6 py-5 border-t border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-6">
            {order.termsAndConditions && (
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Terms &amp; Conditions</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">{order.termsAndConditions}</p>
              </div>
            )}
            {order.discountType && order.discountValue > 0 && (
              <div className="w-full max-w-xs space-y-1.5">
                <p className="flex justify-between text-sm text-slate-600"><span>Subtotal</span> <span className="font-semibold">{formatQAR(order.subtotal || order.totalAmount)}</span></p>
                <p className="flex justify-between text-sm text-rose-600">
                  <span>Discount {order.discountType === 'PERCENT' ? `(${order.discountValue}%)` : ''}</span>
                  <span className="font-semibold">-{formatQAR((order.subtotal || order.totalAmount) - order.totalAmount)}</span>
                </p>
                <p className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200"><span>Total</span> <span>{formatQAR(order.totalAmount)}</span></p>
              </div>
            )}
          </div>
        )}

        {canFulfill && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="space-y-2">
              <button
                onClick={handleCreateDelivery}
                disabled={isDelivering}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md shadow-sm disabled:bg-gray-400"
              >
                {isDelivering ? 'Creating Delivery...' : '🚚 Create Delivery'}
              </button>
              {deliveryError && <p className="text-rose-600 text-sm font-semibold">{deliveryError}</p>}
            </div>
            <div className="space-y-2">
              {taxes.length > 0 && (
                <select
                  value={invoiceTaxId}
                  onChange={(e) => setInvoiceTaxId(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm text-black bg-white"
                >
                  <option value="">No tax</option>
                  {taxes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                  ))}
                </select>
              )}
              {paymentTerms.length > 0 && (
                <select
                  value={invoicePaymentTermId}
                  onChange={(e) => setInvoicePaymentTermId(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm text-black bg-white"
                >
                  <option value="">No payment term</option>
                  {paymentTerms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.days} days)</option>
                  ))}
                </select>
              )}
              {currencies.length > 0 && (
                <select
                  value={invoiceCurrencyId}
                  onChange={(e) => setInvoiceCurrencyId(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm text-black bg-white"
                >
                  <option value="">QAR only</option>
                  {currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>Quote in {c.code}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleCreateInvoice}
                disabled={isInvoicing}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-md shadow-sm disabled:bg-gray-400"
              >
                {isInvoicing ? 'Creating Invoice...' : '🧾 Create Invoice'}
              </button>
              {invoiceError && <p className="text-rose-600 text-sm font-semibold">{invoiceError}</p>}
            </div>
          </div>
        )}
      </div>

      {/* DELIVERIES LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>🚚</span> Deliveries
          </h2>
        </div>
        {order.deliveries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No deliveries yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {order.deliveries.map((d: any) => (
              <Link
                key={d.id}
                href={`/dashboard/deliveries/${d.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-800">Delivery #{d.id.toString().padStart(4, '0')}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatDateTime(d.createdAt)} · {d.items.length} line(s)</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${deliveryStatusBadge[d.status]}`}>
                  {d.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* INVOICES LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
            <span>🧾</span> Invoices
          </h2>
        </div>
        {order.invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No invoices yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {order.invoices.map((inv: any) => (
              <Link
                key={inv.id}
                href={`/dashboard/sales-invoices/${inv.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-800 font-mono">{inv.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatDateTime(inv.createdAt)} · {formatQAR(inv.totalAmount)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ring-inset ${
                  inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                  inv.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                  'bg-rose-50 text-rose-700 ring-rose-600/20'
                }`}>
                  {inv.paymentStatus}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
