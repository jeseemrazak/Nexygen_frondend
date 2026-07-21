'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken } from '@/lib/config';

export default function NewQuotationPage() {
  const router = useRouter();

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [clientName, setClientName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getClientToken();
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const whRes = await fetch(`${API_BASE_URL}/warehouses`, { headers });
      if (whRes.ok) setWarehouses(await whRes.json());
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/products/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setSearchResults(await res.json());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addToCart = (product: any) => {
    if (cart.find(item => item.productId === product.id)) return;

    setCart([...cart, {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty. Please add items.");
    setShowModal(true);
  };

  const executeQuotationCreation = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const token = getClientToken();
    const items = cart.map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    const res = await fetch(`${API_BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        warehouseId: Number(selectedWarehouse),
        clientName: clientName || undefined,
        validUntil: validUntil || undefined,
        items,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      router.push('/dashboard/quotations');
      router.refresh();
    } else {
      const errorData = await res.json();
      setErrorMessage(errorData.message || 'Failed to create quotation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📝</span>
              <h3 className="text-xl font-bold text-gray-900">Confirm Quotation</h3>
            </div>
            <p className="text-gray-600 mb-2">
              You are about to create a quotation for <strong className="text-teal-700">{formatQAR(totalAmount)}</strong>. No stock will be deducted until it's converted into an order.
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
                onClick={executeQuotationCreation}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-md font-bold text-white bg-gray-900 hover:bg-black disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? '⏳ Creating...' : 'Yes, Create Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">New Quotation</h1>
      </div>

      <form onSubmit={handleInitialSubmit} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Likely Warehouse <span className="text-red-500">*</span></label>
            <select required value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white">
              <option value="">Select location...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Client / Shop Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. City Center Mall"
              className="w-full border border-gray-300 rounded-md p-3 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Valid Until <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-black"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">Search Product (Name/SKU/Barcode)</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search products..."
            className="w-full border border-teal-500 rounded-md p-3 text-black shadow-inner"
          />

          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-96 overflow-y-auto left-0">
              {searchResults.map((product: any) => (
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
                  <span className="text-sm text-gray-500">List price: {formatQAR(product.price)}</span>
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
                  <th className="p-4 text-sm text-gray-600">Qty</th>
                  <th className="p-4 text-sm text-gray-600 text-right">Unit Price</th>
                  <th className="p-4 text-sm text-gray-600 text-right">Total</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.productId} className="border-b border-gray-50 text-black">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => { const newCart = [...cart]; newCart[index].quantity = Number(e.target.value); setCart(newCart); }} className="w-20 border border-gray-300 rounded p-1" />
                    </td>
                    <td className="p-4 text-right">
                      <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => { const newCart = [...cart]; newCart[index].price = Number(e.target.value); setCart(newCart); }} className="w-24 border border-gray-300 rounded p-1 text-right" />
                    </td>
                    <td className="p-4 text-right font-bold">{formatQAR(item.price * item.quantity)}</td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} className="text-red-500 text-sm font-bold hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Total Quoted Value</p>
                <p className="text-3xl font-bold text-teal-700 mt-1">{formatQAR(totalAmount)}</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-md font-bold transition shadow-md disabled:bg-gray-400"
              >
                Create Quotation
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
