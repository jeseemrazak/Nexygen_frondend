'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default function PosCheckoutPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  const [showPinPad, setShowPinPad] = useState(false);
  const [pinStaffId, setPinStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [servedBy, setServedBy] = useState<{ id: number; name: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const [whRes, pmRes, staffRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warehouses`, { headers }),
        fetch(`${API_BASE_URL}/accounting/payment-methods?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/pos-staff?activeOnly=true`, { headers }),
      ]);
      if (whRes.ok) setWarehouses(await whRes.json());
      if (pmRes.ok) setPaymentMethods(await pmRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) {
      setSession(null);
      return;
    }
    const loadSession = async () => {
      setSessionLoading(true);
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/pos-sessions/open?warehouseId=${selectedWarehouse}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setSession(res.ok ? await res.json() : null);
      setSessionLoading(false);
    };
    loadSession();
  }, [selectedWarehouse]);

  useEffect(() => {
    if (searchQuery.length < 2 || !selectedWarehouse) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/products/search?q=${searchQuery}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedWarehouse]);

  const addToCart = (product: any, batchNumber: string, available: number) => {
    if (cart.find((i) => i.productId === product.id && i.batchNumber === batchNumber)) return;
    setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, batchNumber, available }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleVerifyPin = async () => {
    setPinError('');
    if (!pinStaffId) {
      setPinError('Select a staff member.');
      return;
    }
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-staff/${pinStaffId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const data = await res.json();
      setServedBy({ id: data.id, name: data.name });
      setShowPinPad(false);
      setPin('');
    } else {
      setPinError('Incorrect PIN.');
    }
  };

  const handleCompleteSale = async () => {
    setSubmitError('');
    if (cart.length === 0) return setSubmitError('Cart is empty.');
    if (!selectedPaymentMethodId) return setSubmitError('Select a payment method.');
    if (!session) return setSubmitError('No open session for this warehouse.');

    setIsSubmitting(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: session.id,
        paymentMethodId: Number(selectedPaymentMethodId),
        servedById: servedBy?.id,
        clientName: clientName || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, batchNumber: i.batchNumber })),
      }),
    });
    if (res.ok) {
      setLastSale(await res.json());
      setCart([]);
      setClientName('');
      setSelectedPaymentMethodId('');
    } else {
      const err = await res.json();
      setSubmitError(err.message || 'Failed to complete sale.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">

      {/* PIN PAD MODAL */}
      {showPinPad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Staff PIN</h3>
            <select
              value={pinStaffId}
              onChange={(e) => setPinStaffId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-black bg-white mb-3"
            >
              <option value="">Select staff...</option>
              {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full border border-gray-300 rounded-md p-3 text-black text-center text-2xl tracking-widest mb-3"
            />
            {pinError && <p className="text-rose-600 text-sm font-semibold mb-3">{pinError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowPinPad(false); setPin(''); setPinError(''); }} className="px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleVerifyPin} className="px-6 py-2 rounded-md font-bold text-white bg-gray-900 hover:bg-black">
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAST SALE RECEIPT MODAL */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 text-center">
            <span className="text-4xl">✅</span>
            <h3 className="text-xl font-bold text-gray-900 mt-2">Sale Complete</h3>
            <p className="font-mono text-teal-700 font-bold mt-1">{lastSale.invoiceNumber}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatQAR(lastSale.totalAmount)}</p>
            <button onClick={() => setLastSale(null)} className="mt-4 px-6 py-2 rounded-md font-bold text-white bg-teal-600 hover:bg-teal-700">
              New Sale
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">POS Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Walk-in sale — pick a warehouse with an open session to begin.</p>
        </div>
        <select value={selectedWarehouse} onChange={(e) => { setSelectedWarehouse(e.target.value); setCart([]); }} className="border border-gray-300 rounded-md p-3 text-black bg-white">
          <option value="">Select warehouse...</option>
          {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {selectedWarehouse && !sessionLoading && !session && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex justify-between items-center">
          <p className="text-sm text-amber-800 font-medium">No open session for this warehouse.</p>
          <Link href="/dashboard/pos/sessions" className="text-teal-700 font-bold text-sm underline whitespace-nowrap">
            Open one →
          </Link>
        </div>
      )}

      {session && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">Search Product (Name/SKU/Barcode)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search products..."
              className="w-full border border-teal-500 rounded-md p-3 text-black shadow-inner"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-96 overflow-y-auto left-0">
                {searchResults.map((product: any) => {
                  const availableBatches = (product.inventories || []).filter((inv: any) => inv.warehouseId === Number(selectedWarehouse) && inv.quantity > 0);
                  if (availableBatches.length === 0) return null;
                  return (
                    <div key={product.id} className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div>
                        <p className="font-bold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-500">{formatQAR(product.price)}</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        {availableBatches.map((inv: any) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => addToCart(product, inv.batchNumber, inv.quantity)}
                            className="flex justify-between items-center gap-6 px-4 py-2 border border-teal-200 bg-teal-50 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition rounded-md text-teal-900"
                          >
                            <span className="font-mono font-bold">Batch {inv.batchNumber}</span>
                            <span className="font-bold">Qty: {inv.quantity}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {cart.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Cart is empty — search for a product above.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm text-gray-600">Product</th>
                    <th className="p-4 text-sm text-gray-600">Batch</th>
                    <th className="p-4 text-sm text-gray-600">Qty</th>
                    <th className="p-4 text-sm text-gray-600 text-right">Unit Price</th>
                    <th className="p-4 text-sm text-gray-600 text-right">Total</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={`${item.productId}-${item.batchNumber}`} className="border-b border-gray-50 text-black">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 font-mono text-sm text-teal-700 bg-teal-50 rounded px-2 inline-block font-bold">{item.batchNumber}</td>
                      <td className="p-4">
                        <input
                          type="number" min="1" max={item.available} value={item.quantity}
                          onChange={(e) => { const newCart = [...cart]; newCart[index].quantity = Number(e.target.value); setCart(newCart); }}
                          className="w-20 border border-gray-300 rounded p-1"
                        />
                      </td>
                      <td className="p-4 text-right text-gray-600">{formatQAR(item.price)}</td>
                      <td className="p-4 text-right font-bold">{formatQAR(item.price * item.quantity)}</td>
                      <td className="p-4 text-right">
                        <button type="button" onClick={() => setCart(cart.filter((c) => !(c.productId === item.productId && c.batchNumber === item.batchNumber)))} className="text-red-500 text-sm font-bold hover:underline">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client (optional)</label>
                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Walk-in" className="w-full border border-gray-300 rounded-md p-2 text-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <select value={selectedPaymentMethodId} onChange={(e) => setSelectedPaymentMethodId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black bg-white">
                      <option value="">Select...</option>
                      {paymentMethods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Served By</label>
                    <button type="button" onClick={() => setShowPinPad(true)} className="w-full border border-gray-300 rounded-md p-2 text-left text-black bg-white hover:bg-gray-50">
                      {servedBy ? `👤 ${servedBy.name}` : 'Tap to enter PIN...'}
                    </button>
                  </div>
                </div>

                {submitError && <p className="text-rose-600 text-sm font-semibold">{submitError}</p>}

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-3xl font-bold text-teal-700 mt-1">{formatQAR(totalAmount)}</p>
                  </div>
                  <button
                    onClick={handleCompleteSale}
                    disabled={isSubmitting}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-md font-bold transition shadow-md disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'Processing...' : 'Complete Sale'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
