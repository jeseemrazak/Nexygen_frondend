'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken, safeJson } from '@/lib/config';

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [reference, setReference] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  const [taxes, setTaxes] = useState<any[]>([]);
  const [taxId, setTaxId] = useState('');
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [costCenterId, setCostCenterId] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getClientToken();
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const [supRes, whRes] = await Promise.all([
        fetch(`${API_BASE_URL}/suppliers`, { headers }),
        fetch(`${API_BASE_URL}/warehouses`, { headers })
      ]);
      if (supRes.ok) setSuppliers(await supRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
      const taxRes = await fetch(`${API_BASE_URL}/accounting/taxes?activeOnly=true`, { headers });
      if (taxRes.ok) {
        const taxData = await taxRes.json();
        setTaxes(taxData);
        const def = taxData.find((t: any) => t.isDefault);
        if (def) setTaxId(String(def.id));
      }
      const ccRes = await fetch(`${API_BASE_URL}/accounting/cost-centers?activeOnly=true`, { headers });
      if (ccRes.ok) setCostCenters(await ccRes.json());
      const prodRes = await fetch(`${API_BASE_URL}/products`, { headers });
      if (prodRes.ok) {
        const all = await prodRes.json();
        setProducts(all.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }
    };
    fetchInitialData();
  }, []);

  // Filters the already-fetched full catalog client-side — instant, no debounce/network
  // round-trip needed since `products` was loaded once up front.
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcodePcs?.toLowerCase().includes(q) ||
      p.barcodeBox?.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [products, productSearch]);

  const addToCart = (product: any) => {
    if (cart.find(item => item.productId === product.id)) {
      setProductSearch('');
      return;
    }

    // Suggest this product's default tax onto the order the moment it becomes the first line —
    // never overrides a tax the user already picked, and never fires again after that.
    if (cart.length === 0 && !taxId && product.taxId) {
      setTaxId(String(product.taxId));
    }

    setCart([...cart, {
      productId: product.id,
      name: product.name,
      unitCost: product.price,
      quantityOrdered: 1,
    }]);
    setProductSearch('');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unitCost * item.quantityOrdered), 0);
  const selectedTax = taxes.find((t: any) => String(t.id) === taxId);
  const taxAmount = selectedTax ? Math.round(subtotal * (selectedTax.rate / 100) * 100) / 100 : 0;
  const totalAmount = subtotal + taxAmount;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty. Please add items.");
    setShowModal(true);
  };

  const executePurchaseOrderCreation = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = getClientToken();
      const items = cart.map(item => ({
        productId: item.productId,
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
      }));

      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          supplierId: Number(selectedSupplier),
          warehouseId: Number(selectedWarehouse),
          reference: reference || undefined,
          taxId: selectedTax ? selectedTax.id : undefined,
          costCenterId: costCenterId ? Number(costCenterId) : undefined,
          items,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        router.push('/dashboard/purchases');
        router.refresh();
      } else {
        const errorData = await safeJson(res);
        setErrorMessage(errorData?.message || `Failed to create purchase order (HTTP ${res.status}).`);
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrorMessage('Network error — please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📥</span>
              <h3 className="text-xl font-bold text-gray-900">Confirm Purchase Order</h3>
            </div>
            <p className="text-gray-600 mb-2">
              You are about to create a draft purchase order for <strong className="text-teal-700">{formatQAR(totalAmount)}</strong>.
            </p>
            {errorMessage && <p className="text-rose-600 text-sm font-semibold mb-4">{errorMessage}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executePurchaseOrderCreation}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-md font-bold text-white bg-gray-900 hover:bg-black disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? '⏳ Creating...' : 'Yes, Create Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">New Purchase Order</h1>
      </div>

      <form onSubmit={handleInitialSubmit} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Supplier <span className="text-red-500">*</span></label>
            <select required value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Receiving Warehouse <span className="text-red-500">*</span></label>
            <select required value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
              <option value="">Select location...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Supplier Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Supplier invoice #"
              className="w-full border border-gray-300 rounded-md p-3 text-black"
            />
          </div>

          {taxes.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tax</label>
              <select value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
                <option value="">No tax</option>
                {taxes.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                ))}
              </select>
            </div>
          )}

          {costCenters.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cost Center</label>
              <select value={costCenterId} onChange={(e) => setCostCenterId(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
                <option value="">-- None --</option>
                {costCenters.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">Search Product (Name/SKU/Barcode)</label>
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Type to search products..."
            className="w-full border border-teal-500 rounded-md p-3 text-black shadow-inner"
          />

          {filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-96 overflow-y-auto left-0">
              {filteredProducts.map((product: any) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full text-left p-4 border-b border-gray-100 hover:bg-teal-50 transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-gray-800">{product.name}</p>
                    {product.sku && <p className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku}</p>}
                  </div>
                  <span className="text-sm text-gray-500">Default cost: {formatQAR(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-sm text-gray-600">Product</th>
                  <th className="p-4 text-sm text-gray-600">Qty Ordered</th>
                  <th className="p-4 text-sm text-gray-600 text-right">Unit Cost</th>
                  <th className="p-4 text-sm text-gray-600 text-right">Line Total</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.productId} className="border-b border-gray-50 text-black">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <input type="number" min="1" value={item.quantityOrdered} onChange={(e) => { const newCart = [...cart]; newCart[index].quantityOrdered = Number(e.target.value); setCart(newCart); }} className="w-24 border border-gray-300 rounded p-1" />
                    </td>
                    <td className="p-4 text-right">
                      <input type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => { const newCart = [...cart]; newCart[index].unitCost = Number(e.target.value); setCart(newCart); }} className="w-28 border border-gray-300 rounded p-1 text-right" />
                    </td>
                    <td className="p-4 text-right font-bold">{formatQAR(item.unitCost * item.quantityOrdered)}</td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} className="text-red-500 text-sm font-bold hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div>
                {taxAmount > 0 && (
                  <p className="text-sm text-gray-600 flex justify-between gap-8"><span>Subtotal</span> <span>{formatQAR(subtotal)}</span></p>
                )}
                {taxAmount > 0 && (
                  <p className="text-sm text-gray-600 flex justify-between gap-8"><span>Tax ({selectedTax?.name})</span> <span className="font-semibold">{formatQAR(taxAmount)}</span></p>
                )}
                <p className="text-sm text-gray-500 uppercase tracking-wide">Total Purchase Value</p>
                <p className="text-3xl font-bold text-teal-700 mt-1">{formatQAR(totalAmount)}</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-md font-bold transition shadow-md disabled:bg-gray-400"
              >
                Create Draft Purchase Order
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
