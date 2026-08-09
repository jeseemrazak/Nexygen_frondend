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

type OrderDraft = {
  id: string;
  label: string;
  cart: CartLine[];
  selectedCustomerId: string;
  discountInput: string;
  taxId: string;
};

const makeEmptyOrder = (n: number, defaultTaxId = ''): OrderDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: `Order ${n}`,
  cart: [],
  selectedCustomerId: '',
  discountInput: '',
  taxId: defaultTaxId,
});

// Round `total` up to the next multiple of `step` — the building block for the cash quick-amount
// row (e.g. a 33.35 total suggests 34 / 35 / 40 / 50, exactly matching how most POS tills round
// a cash tender up to the next coin/note denomination instead of making the cashier type it).
const roundUpTo = (total: number, step: number) => Math.ceil(total / step) * step;
const quickCashAmounts = (total: number): number[] => {
  if (total <= 0) return [];
  const candidates = [roundUpTo(total, 1), roundUpTo(total, 5), roundUpTo(total, 10), roundUpTo(total, 50)];
  return Array.from(new Set(candidates)).slice(0, 4);
};

const isCashMethod = (m: any) => !!m?.name?.toLowerCase().includes('cash');

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
      className={`text-left bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all relative ${
        outOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 active:scale-[.97]'
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${isService ? 'bg-purple-400' : outOfStock ? 'bg-rose-300' : 'bg-purple-400'}`} />
      <div className="p-2.5 pt-3.5">
        <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 h-8">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-purple-700 font-bold text-sm">{formatQAR(product.price)}</span>
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
  const [taxes, setTaxes] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);
  const [posCategories, setPosCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Order tabs — every unpaid draft order stays simultaneously accessible as a tab instead of
  // hiding parked carts behind a "Held Sales" modal.
  const [orders, setOrders] = useState<OrderDraft[]>(() => [makeEmptyOrder(1)]);
  const [activeOrderId, setActiveOrderId] = useState(() => orders[0].id);
  const activeOrder = orders.find((o) => o.id === activeOrderId) ?? orders[0];
  const cart = activeOrder.cart;
  const selectedCustomerId = activeOrder.selectedCustomerId;
  const discountInput = activeOrder.discountInput;
  const taxId = activeOrder.taxId;

  const updateActiveOrder = (updater: (o: OrderDraft) => OrderDraft) => {
    setOrders((prev) => prev.map((o) => (o.id === activeOrderId ? updater(o) : o)));
  };
  const setCart = (updater: CartLine[] | ((prev: CartLine[]) => CartLine[])) => {
    updateActiveOrder((o) => ({ ...o, cart: typeof updater === 'function' ? (updater as (p: CartLine[]) => CartLine[])(o.cart) : updater }));
  };
  const setSelectedCustomerId = (val: string) => updateActiveOrder((o) => ({ ...o, selectedCustomerId: val }));
  const setDiscountInput = (val: string | ((prev: string) => string)) => {
    updateActiveOrder((o) => ({ ...o, discountInput: typeof val === 'function' ? (val as (p: string) => string)(o.discountInput) : val }));
  };
  const setTaxId = (val: string) => updateActiveOrder((o) => ({ ...o, taxId: val }));

  // Payment panel — inline, always docked under the cart (no separate full-screen step). Reset
  // whenever the active order changes so a half-typed tender never leaks onto the next sale.
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  const resetPaymentPanel = () => {
    setSplitMode(false);
    setAmountReceived('');
    setSplitAmounts({});
  };

  const addOrder = () => {
    const defaultTax = taxes.find((t: any) => t.isDefault);
    const next = makeEmptyOrder(orders.length + 1, defaultTax ? String(defaultTax.id) : '');
    setOrders((prev) => [...prev, next]);
    setActiveOrderId(next.id);
    resetPaymentPanel();
  };

  const switchOrder = (id: string) => {
    setActiveOrderId(id);
    resetPaymentPanel();
  };

  const closeOrder = (id: string) => {
    if (orders.length === 1) return;
    const idx = orders.findIndex((o) => o.id === id);
    const remaining = orders.filter((o) => o.id !== id);
    setOrders(remaining);
    if (activeOrderId === id) {
      const fallback = remaining[Math.max(0, idx - 1)] ?? remaining[0];
      switchOrder(fallback.id);
    }
  };

  const [batchPicker, setBatchPicker] = useState<{ product: any; batches: any[] } | null>(null);

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
      const [whRes, pmRes, taxRes, staffRes, prodRes, custRes, posCatRes, settingsRes, loyaltyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warehouses`, { headers }),
        fetch(`${API_BASE_URL}/accounting/payment-methods?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/accounting/taxes?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/pos-staff?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/products?posActiveOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/customers`, { headers }),
        fetch(`${API_BASE_URL}/pos-categories?activeOnly=true`, { headers }),
        fetch(`${API_BASE_URL}/settings/company`, { headers }),
        fetch(`${API_BASE_URL}/app-modules/loyalty-rewards`, { headers }),
      ]);
      const [whData, pmData, taxData] = await Promise.all([
        whRes.ok ? whRes.json() : [],
        pmRes.ok ? pmRes.json() : [],
        taxRes.ok ? taxRes.json() : [],
      ]);
      setWarehouses(whData);
      setPaymentMethods(pmData);
      setTaxes(taxData);
      const defaultTax = taxData.find((t: any) => t.isDefault);
      if (defaultTax) {
        setOrders((prev) => prev.map((o) => (o.taxId === '' ? { ...o, taxId: String(defaultTax.id) } : o)));
      }
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (posCatRes.ok) setPosCategories(await posCatRes.json());
      let settingsData: any = null;
      if (settingsRes.ok) {
        settingsData = await settingsRes.json();
        setSettings(settingsData);
        if (settingsData.posDefaultWarehouseId && whData.some((w: any) => w.id === settingsData.posDefaultWarehouseId)) {
          setSelectedWarehouse(String(settingsData.posDefaultWarehouseId));
        }
      }
      if (loyaltyRes.ok) {
        const loyaltyMod = await loyaltyRes.json();
        setLoyaltyActive(loyaltyMod.isActive);
        setLoyaltyConfig(loyaltyMod.config || {});
      }
      // Default the payment panel to the configured default method, else the first active one.
      const defaultId = settingsData?.posDefaultPaymentMethodId;
      const fallback = pmData.find((m: any) => m.id === defaultId) || pmData[0];
      if (fallback) setSelectedMethodId(String(fallback.id));
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
  const netAfterDiscount = subtotal - discountAmount;
  const selectedTax = taxes.find((t: any) => String(t.id) === taxId);
  const taxAmount = selectedTax ? Math.round(netAfterDiscount * (selectedTax.rate / 100) * 100) / 100 : 0;
  const totalAmount = netAfterDiscount + taxAmount;

  const selectedMethod = paymentMethods.find((m: any) => String(m.id) === selectedMethodId);
  const receivedNum = Number(amountReceived) || 0;
  const change = Math.max(0, receivedNum - totalAmount);

  const splitTotal = useMemo(
    () => Object.values(splitAmounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [splitAmounts],
  );
  const splitRemaining = Math.round((totalAmount - splitTotal) * 100) / 100;

  const tenders = useMemo(() => {
    if (splitMode) {
      return Object.entries(splitAmounts)
        .filter(([, v]) => Number(v) > 0)
        .map(([paymentMethodId, v]) => ({ paymentMethodId: Number(paymentMethodId), amount: Number(v) }));
    }
    return selectedMethodId ? [{ paymentMethodId: Number(selectedMethodId), amount: totalAmount }] : [];
  }, [splitMode, splitAmounts, selectedMethodId, totalAmount]);

  const canCharge =
    cart.length > 0 &&
    !isSubmitting &&
    (splitMode ? tenders.length > 0 && Math.abs(splitRemaining) <= 0.01 : !!selectedMethodId);

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

  const handleCharge = async () => {
    setSubmitError('');
    if (cart.length === 0) return setSubmitError('Cart is empty.');
    if (!session) return setSubmitError('No open session for this warehouse.');
    if (settings?.posRequireCustomer && !selectedCustomerId) return setSubmitError('Select a customer to continue.');
    if (settings?.posMaxDiscountPercent != null && subtotal > 0) {
      const discountPercent = (discountAmount / subtotal) * 100;
      if (discountPercent > settings.posMaxDiscountPercent) {
        return setSubmitError(`Discount exceeds the maximum allowed (${settings.posMaxDiscountPercent}%). Get manager approval.`);
      }
    }
    if (tenders.some((t) => {
      const m = paymentMethods.find((pm: any) => pm.id === t.paymentMethodId);
      return m?.type === 'ACCOUNT_RECEIVABLE' && !selectedCustomerId;
    })) {
      return setSubmitError('Select or add a customer to leave a balance on account.');
    }
    if (!canCharge) return;

    setIsSubmitting(true);
    const token = getClientToken();
    const payload: any = {
      sessionId: session.id,
      servedByToken: servedBy?.staffToken,
      customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      discountAmount: discountAmount || undefined,
      taxId: selectedTax ? selectedTax.id : undefined,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, batchNumber: i.batchNumber })),
    };
    if (tenders.length === 1) {
      payload.paymentMethodId = tenders[0].paymentMethodId;
    } else {
      payload.payments = tenders;
    }
    const res = await fetch(`${API_BASE_URL}/pos-sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const sale = await res.json();
      setLastSale(sale);
      updateActiveOrder((o) => ({ ...o, cart: [], selectedCustomerId: '', discountInput: '' }));
      resetPaymentPanel();
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
                  className="w-full flex justify-between items-center gap-6 px-4 py-2.5 border border-purple-200 bg-purple-50 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition rounded-md text-purple-900"
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
              <p className="font-mono text-purple-700 font-bold mt-1">{lastSale.invoiceNumber}</p>
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
                <span className="font-bold text-purple-700">{formatQAR(lastSale.totalAmount)}</span>
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
              <button onClick={() => setLastSale(null)} className="flex-1 px-4 py-2.5 rounded-md font-bold text-white bg-purple-600 hover:bg-purple-700">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-purple-600 px-5 py-3 flex items-center gap-4 shrink-0">
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

      {/* ORDER TABS STRIP */}
      {selectedWarehouse && session && (
        <div className="bg-white border-b border-gray-200 px-3 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => switchOrder(o.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-colors ${
                o.id === activeOrderId ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{o.label}{o.cart.length > 0 ? ` (${o.cart.reduce((s, l) => s + l.quantity, 0)})` : ''}</span>
              {orders.length > 1 && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); closeOrder(o.id); }}
                  className="text-gray-400 hover:text-rose-500 font-bold"
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <button type="button" onClick={addOrder} className="shrink-0 px-3 py-2 text-purple-600 hover:text-purple-800 font-bold text-sm">
            +
          </button>
        </div>
      )}

      {!selectedWarehouse ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-semibold">
          Select a warehouse above to start a sale.
        </div>
      ) : sessionLoading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-semibold">Loading...</div>
      ) : !session ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
          <p className="text-amber-800 font-medium">No open session for this warehouse.</p>
          <Link href="/dashboard/pos/sessions" className="text-purple-700 font-bold text-sm underline">Open one →</Link>
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
                      selectedCategoryId === '' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
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
                        selectedCategoryId === String(c.id) ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
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

          {/* RIGHT: TICKET PANEL (cart + inline payment, single screen) */}
          <div className="w-[360px] shrink-0 bg-[#E8F4FD] border-l border-[#BBDEFB] flex flex-col">
            <div className="p-4 border-b border-[#D8E9F5] flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">Ticket {totalItems > 0 ? `· ${totalItems}` : ''}</span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setCart([]); resetPaymentPanel(); }}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="px-4 py-2.5 border-b border-[#D8E9F5] flex items-center gap-2">
              <span className="text-purple-700 text-sm">👤</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => { setSelectedCustomerId(e.target.value); setRedeemPointsInput(''); setRedeemError(''); }}
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
              >
                <option value="">Walk-in customer</option>
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
                      className="text-purple-700 hover:text-purple-900 font-bold text-xs underline disabled:opacity-40"
                    >
                      {redeeming ? 'Redeeming...' : 'Redeem for discount'}
                    </button>
                  </div>
                )}
                {redeemError && <p className="text-rose-600 text-[11px] font-semibold mt-1">{redeemError}</p>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[80px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                  <span className="text-4xl">🛒</span>
                  <span className="font-semibold text-sm">Tap a product to start</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.batchNumber}`}
                    className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center gap-2 bg-white/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">
                        {formatQAR(item.price)} × {item.quantity} = <span className="font-bold text-gray-700">{formatQAR(item.price * item.quantity)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QtyBtn symbol="-" color="bg-rose-100 text-rose-600 hover:bg-rose-200" onClick={() => decrementLine(item.productId, item.batchNumber)} />
                      <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                      <QtyBtn symbol="+" color="bg-purple-100 text-purple-700 hover:bg-purple-200" onClick={() => incrementLine(item.productId, item.batchNumber)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals + discount */}
            <div className="px-4 pt-3 border-t border-[#D8E9F5] bg-white/60 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatQAR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                <span>Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-24 border border-gray-300 rounded-md p-1 text-sm text-black text-right"
                />
              </div>
              {taxes.length > 0 && (
                <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                  <span>Tax</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="border border-gray-300 rounded-md p-1 text-xs text-black bg-white"
                    >
                      <option value="">No tax</option>
                      {taxes.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <span>{formatQAR(taxAmount)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-800 font-bold">Total</span>
                <span className="text-purple-700 font-bold text-xl">{formatQAR(totalAmount)}</span>
              </div>
            </div>

            {/* Inline payment panel */}
            <div className="p-4 border-t border-[#D8E9F5] bg-white/60 space-y-3 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.filter((m: any) => m.type !== 'ACCOUNT_RECEIVABLE').map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSplitMode(false); setSelectedMethodId(String(m.id)); setAmountReceived(''); }}
                    className={`px-3.5 h-9 rounded-lg text-xs font-bold border transition-colors ${
                      !splitMode && selectedMethodId === String(m.id)
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSplitMode(true)}
                  className={`px-3.5 h-9 rounded-lg text-xs font-bold border transition-colors ${
                    splitMode ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  Split
                </button>
              </div>

              {splitMode ? (
                <div className="space-y-2">
                  {paymentMethods.map((m: any) => {
                    const gated = m.type === 'ACCOUNT_RECEIVABLE' && !selectedCustomerId;
                    return (
                      <div key={m.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${gated ? 'text-gray-400' : 'text-gray-700'}`}>
                            {m.type === 'ACCOUNT_RECEIVABLE' ? 'On account' : m.name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={gated}
                            value={splitAmounts[m.id] || ''}
                            onChange={(e) => setSplitAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="0.00"
                            className="w-24 border border-gray-300 rounded-md p-1 text-sm text-black text-right disabled:bg-gray-100"
                          />
                        </div>
                        {gated && <p className="text-[11px] text-amber-600 mt-0.5">Select or add a customer to leave a balance on account</p>}
                      </div>
                    );
                  })}
                  <div className={`flex items-center justify-between text-xs font-bold ${Math.abs(splitRemaining) <= 0.01 ? 'text-purple-600' : 'text-rose-500'}`}>
                    <span>{splitRemaining > 0.01 ? 'Remaining' : splitRemaining < -0.01 ? 'Over' : 'Balanced'}</span>
                    <span>{formatQAR(Math.abs(splitRemaining))}</span>
                  </div>
                </div>
              ) : selectedMethod && isCashMethod(selectedMethod) ? (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {quickCashAmounts(totalAmount).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountReceived(String(amt))}
                        className="flex-1 h-8 rounded-md text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-purple-300"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Amount received"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Change</span>
                    <span className="font-bold text-gray-800">{formatQAR(change)}</span>
                  </div>
                </div>
              ) : null}

              {submitError && <p className="text-rose-600 text-xs font-semibold">{submitError}</p>}

              <button
                onClick={handleCharge}
                disabled={!canCharge}
                className="w-full h-12 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
              >
                {isSubmitting ? 'Processing...' : splitMode ? `Split · ${formatQAR(totalAmount)}` : `Charge · ${formatQAR(totalAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
