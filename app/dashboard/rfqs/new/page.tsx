'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken } from '@/lib/config';

export default function NewRfqPage() {
  const router = useRouter();

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchWarehouses = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/warehouses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setWarehouses(await res.json());
    };
    fetchWarehouses();
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
    setCart([...cart, { productId: product.id, name: product.name, quantity: 1 }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Add at least one item to request quotes for.');

    setIsSubmitting(true);
    setErrorMessage('');
    const token = getClientToken();

    const res = await fetch(`${API_BASE_URL}/rfqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        warehouseId: Number(selectedWarehouse),
        items: cart.map(item => ({ productId: item.productId, quantity: Number(item.quantity) })),
      }),
    });

    if (res.ok) {
      const rfq = await res.json();
      router.push(`/dashboard/rfqs/${rfq.id}`);
    } else {
      const err = await res.json();
      setErrorMessage(err.message || 'Failed to create RFQ.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">New Request for Quotation</h1>
        <p className="text-sm text-gray-500 mt-1">List what you need, then invite suppliers to quote on it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Receiving Warehouse <span className="text-red-500">*</span></label>
          <select required value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-black bg-white max-w-sm">
            <option value="">Select location...</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
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
                  className="w-full text-left p-4 border-b border-gray-100 hover:bg-teal-50 transition"
                >
                  <p className="font-bold text-gray-800">{product.name}</p>
                  {product.sku && <p className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku}</p>}
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
                  <th className="p-4 text-sm text-gray-600">Quantity Needed</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.productId} className="border-b border-gray-50 text-black">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => { const newCart = [...cart]; newCart[index].quantity = Number(e.target.value); setCart(newCart); }} className="w-24 border border-gray-300 rounded p-1" />
                    </td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} className="text-red-500 text-sm font-bold hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              {errorMessage && <p className="text-rose-600 text-sm font-semibold mb-3">{errorMessage}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-md font-bold transition shadow-md disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating...' : 'Create RFQ'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
