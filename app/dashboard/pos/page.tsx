'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

type CartLine = {
  productId: number;
  batchNumber: string;
  name: string;
  price: number;
  quantity: number;
  available: number;
  isService?: boolean;
};

function QtyBtn({ symbol, color, onClick }: { symbol: '+' | '-'; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm transition-colors ${color}`}
    >
      {symbol}
    </button>
  );
}

function ProductCard({ product, stock, onPick }: { product: any; stock: number; onPick: () => void }) {
  const isService = product.type === 'SERVICE';
  const outOfStock = !isService && stock <= 0;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={outOfStock}
      className={`text-left bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all ${
        outOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5'
      }`}
    >
      <div className="h-24 bg-teal-50 flex items-center justify-center text-3xl">{isService ? '🛠️' : '📦'}</div>
      <div className="p-2.5">
        <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 h-8">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-teal-700 font-bold text-sm">{formatQAR(product.price)}</span>
          {isService ? (
            <span className="text-[11px] font-bold text-purple-600">Service</span>
          ) : (
            <span className={`text-[11px] font-bold ${outOfStock ? 'text-rose-500' : stock < 10 ? 'text-amber-600' : 'text-gray-400'}`}>
              {outOfStock ? 'Out' : stock}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function PosCheckoutPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountInput, setDiscountInput] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [posCategories, setPosCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  const [batchPicker, setBatchPicker] = useState<{ product: any; batches: any[] } | null>(null);

  type HeldSale = { id: string; label: string; cart: CartLine[]; selectedCustomerId: string; discountInput: string; heldAt: string };
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);

  const [showPinPad, setShowPinPad] = useState(false);
  const [pinStaffId, setPinStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [servedBy, setServedBy] = useState<{ id: number; name: string; staffToken: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const [loyaltyActive, setLoyaltyActive] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>({});
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null);
  const [redeemPointsInput, setRedeemPointsInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const [whRes, pmRes, staffRes, prodRes, custRes, posCatRes, settingsRes, loyaltyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warehouses`, { headers }),
        fetch(`${API_BASE_URL}/accounting/payment-methods?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/pos-staff?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/products?posActiveOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/customers`, { headers }),
        fetch(`${API_BASE_URL}/pos-categories?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/settings/company`, { headers }),
        fetch(`${API_BASE_URL}/app-modules/loyalty-rewards`, { headers }),
      ]);
      const [whData, pmData] = await Promise.all([
        whRes.ok ? whRes.json() : [],
        pmRes.ok ? pmRes.json() : [],
      ]);
      setWarehouses(whData);
      setPaymentMethods(pmData);
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (posCatRes.ok) setPosCategories(await posCatRes.json());
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        if (settingsData.posDefaultWarehouseId && whData.some((w: any) => w.id === settingsData.posDefaultWarehouseId)) {
          setSelectedWarehouse(String(settingsData.posDefaultWarehouseId));
        }
        if (settingsData.posDefaultPaymentMethodId && pmData.some((m: any) => m.id === settingsData.posDefaultPaymentMethodId)) {
          setSelectedPaymentMethodId(String(settingsData.posDefaultPaymentMethodId));
        }
      }
      if (loyaltyRes.ok) {
        const loyaltyMod = await loyaltyRes.json();
        setLoyaltyActive(loyaltyMod.isActive);
        setLoyaltyConfig(loyaltyMod.config || {});
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loyaltyActive || !selectedCustomerId) {
      setLoyaltyBalance(null);
      return;
    }
    const loadBalance = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/loyalty/customers/${selectedCustomerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyBalance(data.balance);
      } else {
        setLoyaltyBalance(null);
      }
    };
    loadBalance();
  }, [loyaltyActive, selectedCustomerId]);

  const redeemLoyaltyPoints = async () => {
    const points = Number(redeemPointsInput);
    if (!selectedCustomerId || !points || points <= 0) return;
    setRedeeming(true);
    setRedeemError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customerId: Number(selectedCustomerId), points }),
    });
    if (res.ok) {
      const data = await res.json();
      setDiscountInput((prev) => String((Number(prev) || 0) + data.discountAmount));
      setLoyaltyBalance(data.newBalance);
      setRedeemPointsInput('');
    } else {
      const err = await safeJson(res);
      setRedeemError(err?.message || 'Failed to redeem points.');
    }
    setRedeeming(false);
  };

  useEffect(() => {
    if (!selectedWarehouse) {
      setSession(null);
      return;
    }
    const loadSession = async () => {
      setSessionLoading(true);
      const token = getClientToken();
      try {
        const res = await fetch(`${API_BASE_URL}/pos-sessions/open?warehouseId=${selectedWarehouse}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const text = await res.text();
        setSession(res.ok && text ? JSON.parse(text) : null);
      } catch (error) {
        setSession(null);
      }
      setSessionLoading(false);
    };
    loadSession();
  }, [selectedWarehouse]);

  const stockFor = (product: any) =>
    (product.inventories || [])
      .filter((inv: any) => inv.warehouseId === Number(selectedWarehouse))
      .reduce((sum: number, inv: any) => sum + inv.quantity, 0);

  const batchesFor = (product: any) =>
    (product.inventories || []).filter((inv: any) => inv.warehouseId === Number(selectedWarehouse) && inv.quantity > 0);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p: any) => {
      // Search matches across every category (a category tab is just a starting filter, not a
      // hard boundary) — only apply the category filter when there's no active search.
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcodePcs?.toLowerCase().includes(q) ||
          p.barcodeBox?.toLowerCase().includes(q)
        );
      }
      if (selectedCategoryId) return String(p.posCategoryId) === selectedCategoryId;
      return true;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const addLine = (product: any, batchNumber: string, available: number, isService: boolean) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.batchNumber === batchNumber);
      if (existing) {
        if (!isService && existing.quantity >= available) return prev;
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, batchNumber, name: product.name, price: product.price, quantity: 1, available, isService }];
    });
  };

  const handlePickProduct = (product: any) => {
    if (product.type === 'SERVICE') {
      addLine(product, 'SERVICE', Infinity, true);
      return;
    }
    const batches = batchesFor(product);
    if (batches.length === 0) return;
    if (batches.length === 1) {
      addLine(product, batches[0].batchNumber, batches[0].quantity, false);
      return;
    }
    setBatchPicker({ product, batches });
  };

  const incrementLine = (productId: number, batchNumber: string) => {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId && l.batchNumber === batchNumber && (l.isService || l.quantity < l.available) ? { ...l, quantity: l.quantity + 1 } : l)),
    );
  };

  const decrementLine = (productId: number, batchNumber: string) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId && l.batchNumber === batchNumber ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = Math.min(Math.max(Number(discountInput) || 0, 0), subtotal);
  const totalAmount = subtotal - discountAmount;

  const holdSale = () => {
    if (cart.length === 0) return;
    const label = customers.find((c: any) => String(c.id) === selectedCustomerId)?.name || `Sale @ ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    setHeldSales((prev) => [...prev, { id: `${Date.now()}`, label, cart, selectedCustomerId, discountInput, heldAt: new Date().toISOString() }]);
    setCart([]);
    setSelectedCustomerId('');
    setDiscountInput('');
  };

  const resumeHeldSale = (held: HeldSale) => {
    setCart(held.cart);
    setSelectedCustomerId(held.selectedCustomerId);
    setDiscountInput(held.discountInput);
    setHeldSales((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldSales(false);
  };

  const discardHeldSale = (id: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
  };

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
      setServedBy({ id: data.id, name: data.name, staffToken: data.staffToken });
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
    if (settings?.posRequireCustomer && !selectedCustomerId) return setSubmitError('Select a customer to continue.');
    if (settings?.posMaxDiscountPercent != null && subtotal > 0) {
      const discountPercent = (discountAmount / subtotal) * 100;
      if (discountPercent > settings.posMaxDiscountPercent) {
        return setSubmitError(`Discount exceeds the maximum allowed (${settings.posMaxDiscountPercent}%). Get manager approval.`);
      }
    }

    setIsSubmitting(true);
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/pos-sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: session.id,
        paymentMethodId: Number(selectedPaymentMethodId),
        servedByToken: servedBy?.staffToken,
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        discountAmount: discountAmount || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, batchNumber: i.batchNumber })),
      }),
    });
    if (res.ok) {
      const sale = await res.json();
      setLastSale(sale);
      setCart([]);
      setSelectedCustomerId('');
      setDiscountInput('');
      setSelectedPaymentMethodId(settings?.posDefaultPaymentMethodId ? String(settings.posDefaultPaymentMethodId) : '');
      if (settings?.posAutoPrintReceipt) {
        window.open(`/dashboard/pos/sales/${sale.id}/print`, '_blank', 'noopener,noreferrer');
      }
    } else {
      const err = await safeJson(res);
      setSubmitError(err?.message || `Failed to complete sale (HTTP ${res.status}).`);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm">

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

      {/* BATCH PICKER MODAL */}
      {batchPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{batchPicker.product.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Multiple batches available — pick one</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {batchPicker.batches.map((inv: any) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => { addLine(batchPicker.product, inv.batchNumber, inv.quantity, false); setBatchPicker(null); }}
                  className="w-full flex justify-between items-center gap-6 px-4 py-2.5 border border-teal-200 bg-teal-50 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition rounded-md text-teal-900"
                >
                  <span className="font-mono font-bold">Batch {inv.batchNumber}</span>
                  <span className="font-bold">Qty: {inv.quantity}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setBatchPicker(null)} className="mt-4 w-full px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LAST SALE RECEIPT MODAL */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <div className="text-center">
              <span className="text-4xl">✅</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">Sale Complete</h3>
              <p className="font-mono text-teal-700 font-bold mt-1">{lastSale.invoiceNumber}</p>
            </div>
            <div className="mt-4 border-t border-b border-gray-100 divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {lastSale.items?.map((item: any) => (
                <div key={item.id} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-700">{item.product?.name || `#${item.productId}`} × {item.quantity}</span>
                  <span className="font-bold text-gray-800">{formatQAR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {lastSale.discountAmount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Discount</span>
                  <span>-{formatQAR(lastSale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-teal-700">{formatQAR(lastSale.totalAmount)}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <a
                href={`/dashboard/pos/sales/${lastSale.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2.5 rounded-md font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                🖨️ Print Receipt
              </a>
              <button onClick={() => setLastSale(null)} className="flex-1 px-4 py-2.5 rounded-md font-bold text-white bg-teal-600 hover:bg-teal-700">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELD SALES MODAL */}
      {showHeldSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Held Sales</h3>
            <p className="text-sm text-gray-500 mb-4">Resume a parked cart, or discard it.</p>
            {heldSales.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No held sales.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {heldSales.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-200 rounded-md">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{h.label}</p>
                      <p className="text-xs text-gray-500">{h.cart.length} item(s) · {formatQAR(h.cart.reduce((s, l) => s + l.price * l.quantity, 0))}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => resumeHeldSale(h)} className="text-teal-600 hover:text-teal-800 text-xs font-bold">Resume</button>
                      <button onClick={() => discardHeldSale(h.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Discard</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHeldSales(false)} className="mt-4 w-full px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100">
              Close
            </button>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-teal-600 px-5 py-3 flex items-center gap-4 shrink-0">
        <span className="text-xl">🛒</span>
        <span className="text-white font-bold text-lg">POS</span>
        <select
          value={selectedWarehouse}
          onChange={(e) => { setSelectedWarehouse(e.target.value); setCart([]); }}
          className="bg-white/15 text-white text-sm font-semibold rounded-md px-3 py-1.5 border border-white/20 [&>option]:text-black"
        >
          <option value="" className="text-black">Select warehouse...</option>
          {warehouses.map((w: any) => <option key={w.id} value={w.id} className="text-black">{w.name}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowHeldSales(true)} className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-semibold">
          ⏸️ Held{heldSales.length > 0 ? ` (${heldSales.length})` : ''}
        </button>
        {servedBy ? (
          <button onClick={() => setServedBy(null)} className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold">
            👤 {servedBy.name} (Logout)
          </button>
        ) : (
          <button onClick={() => setShowPinPad(true)} className="flex items-center gap-2 text-white text-sm font-semibold">
            Staff Login
          </button>
        )}
      </div>

      {!selectedWarehouse ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-semibold">
          Select a warehouse above to start a sale.
        </div>
      ) : sessionLoading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-semibold">Loading...</div>
      ) : !session ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
          <p className="text-amber-800 font-medium">No open session for this warehouse.</p>
          <Link href="/dashboard/pos/sessions" className="text-teal-700 font-bold text-sm underline">Open one →</Link>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">

          {/* LEFT: PRODUCT GRID */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            <div className="p-3 shrink-0 space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-black bg-white shadow-sm"
                autoFocus
              />
              {posCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('')}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      selectedCategoryId === '' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    All
                  </button>
                  {posCategories.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(String(c.id))}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        selectedCategoryId === String(c.id) ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 pt-0">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} stock={stockFor(product)} onPick={() => handlePickProduct(product)} />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="p-12 text-center text-gray-400">No products match &quot;{searchQuery}&quot;.</div>
              )}
            </div>
          </div>

          {/* RIGHT: CART PANEL */}
          <div className="w-[340px] shrink-0 bg-[#E8F4FD] border-l border-[#BBDEFB] flex flex-col">
            <div className="p-4 border-b border-[#D8E9F5] flex items-center gap-2">
              <span className="text-teal-700">🛒</span>
              <span className="font-bold text-gray-800 text-sm">Cart ({totalItems} item{totalItems === 1 ? '' : 's'})</span>
            </div>

            <div className="px-4 py-2.5 border-b border-[#D8E9F5] flex items-center gap-2">
              <span className="text-teal-700 text-sm">👤</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => { setSelectedCustomerId(e.target.value); setRedeemPointsInput(''); setRedeemError(''); }}
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {loyaltyActive && selectedCustomerId && loyaltyBalance !== null && (
              <div className="px-4 py-2.5 border-b border-[#D8E9F5] bg-white/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">🎁 Loyalty Points</span>
                  <span className="font-bold text-gray-800">{loyaltyBalance}</span>
                </div>
                {loyaltyConfig.enableRedemption !== false && loyaltyBalance > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="number"
                      min={1}
                      max={loyaltyBalance}
                      value={redeemPointsInput}
                      onChange={(e) => setRedeemPointsInput(e.target.value)}
                      placeholder="Points"
                      className="w-20 border border-gray-300 rounded-md p-1 text-xs text-black"
                    />
                    <button
                      onClick={redeemLoyaltyPoints}
                      disabled={redeeming || !redeemPointsInput}
                      className="text-teal-700 hover:text-teal-900 font-bold text-xs underline disabled:opacity-40"
                    >
                      {redeeming ? 'Redeeming...' : 'Redeem for discount'}
                    </button>
                  </div>
                )}
                {redeemError && <p className="text-rose-600 text-[11px] font-semibold mt-1">{redeemError}</p>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                  <span className="text-5xl">🛒</span>
                  <span className="font-semibold text-sm">Cart is empty</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.productId}-${item.batchNumber}`} className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center gap-2 bg-white/40">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">
                        {item.isService ? <span className="text-purple-600 font-bold">Service</span> : <span className="font-mono">{item.batchNumber}</span>} · {formatQAR(item.price)} × {item.quantity} = <span className="font-bold text-gray-700">{formatQAR(item.price * item.quantity)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QtyBtn symbol="-" color="bg-rose-100 text-rose-600 hover:bg-rose-200" onClick={() => decrementLine(item.productId, item.batchNumber)} />
                      <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                      <QtyBtn symbol="+" color="bg-teal-100 text-teal-700 hover:bg-teal-200" onClick={() => incrementLine(item.productId, item.batchNumber)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#D8E9F5] bg-white/60 space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Discount (QAR)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-24 border border-gray-300 rounded-md p-1.5 text-sm text-black text-right ml-auto"
                />
              </div>

              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Subtotal:</span>
                    <span>{formatQAR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-rose-500">
                    <span>Discount:</span>
                    <span>-{formatQAR(discountAmount)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-bold">Total:</span>
                <span className="text-teal-700 font-bold text-xl">{formatQAR(totalAmount)}</span>
              </div>

              <select value={selectedPaymentMethodId} onChange={(e) => setSelectedPaymentMethodId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm text-black bg-white">
                <option value="">Payment method...</option>
                {paymentMethods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              {submitError && <p className="text-rose-600 text-xs font-semibold">{submitError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={holdSale}
                  disabled={cart.length === 0}
                  className="px-4 h-12 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                >
                  ⏸️ Hold
                </button>
                <button
                  onClick={handleCompleteSale}
                  disabled={isSubmitting || cart.length === 0}
                  className="flex-1 h-12 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  💳 {isSubmitting ? 'Processing...' : 'Charge Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
