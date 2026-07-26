'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getClientToken } from '@/lib/config';

export default function StockTransferPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]); // 🔥 NEW: Store warehouses
  const [loading, setLoading] = useState(false);

  // Form State
  const [type, setType] = useState('TRANSFER'); // TRANSFER, WRITE_OFF, ADJUSTMENT
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [unitCost, setUnitCost] = useState('');
  
  // Smart Search & Batch State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  
  // Click-away reference for the search dropdown
  const searchRef = useRef<HTMLDivElement>(null);

  // 🔥 FETCH BOTH PRODUCTS AND WAREHOUSES ON LOAD
  useEffect(() => {
    const authHeaders = { 'Authorization': `Bearer ${getClientToken()}` };

    // 1. Fetch Products
    fetch(`${API_BASE_URL}/products`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching products:', err));

    // 2. Fetch Warehouses (Assuming your backend has this standard route!)
    fetch(`${API_BASE_URL}/warehouses`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => setWarehouses(data))
      .catch(err => console.error('Error fetching warehouses:', err));
  }, []);

  // Close search dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FILTER PRODUCTS: By Name, SKU, Box Barcode, or PCS Barcode
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcodeBox?.toLowerCase().includes(q) ||
      p.barcodePcs?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product from the search list first.');
      return;
    }

    setLoading(true);

    const payload = {
      type,
      productId: Number(selectedProduct.id),
      batchNumber,
      quantity: Number(quantity),
      reason,
      fromWarehouseId: type === 'TRANSFER' || type === 'WRITE_OFF' ? Number(fromWarehouse) : undefined,
      toWarehouseId: type === 'TRANSFER' || type === 'ADJUSTMENT' ? Number(toWarehouse) : undefined,
      unitCost: type === 'ADJUSTMENT' && unitCost ? Number(unitCost) : undefined,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/products/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getClientToken()}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Stock updated successfully! ✅');
        router.push('/dashboard/inventory/movements'); 
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('An error occurred while transferring stock.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get warehouse name by ID
  const getWarehouseName = (id: number) => {
    const wh = warehouses.find(w => w.id === id);
    return wh ? wh.name : `Warehouse ${id}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mb-2">
          <span>🔄</span> Stock Operations
        </h1>
        <p className="text-slate-500 mb-8">Transfer stock between locations, add stock, or report damages.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Operation Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Operation Type</label>
            <div className="flex gap-4">
              {['TRANSFER', 'WRITE_OFF', 'ADJUSTMENT'].map((op) => (
                <label key={op} className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all font-bold text-sm ${type === op ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value={op} 
                    checked={type === op} 
                    onChange={(e) => {
                      setType(e.target.value);
                      setBatchNumber(''); 
                    }} 
                    className="hidden" 
                  />
                  {op === 'TRANSFER' ? '🚚 Transfer' : op === 'WRITE_OFF' ? '🗑️ Write-off' : '➕ Add Stock'}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 🔥 NEW WAREHOUSE DROPDOWNS */}
            {(type === 'TRANSFER' || type === 'WRITE_OFF') && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">From Warehouse</label>
                <select 
                  required 
                  value={fromWarehouse} 
                  onChange={(e) => setFromWarehouse(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="">-- Select Source --</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {(type === 'TRANSFER' || type === 'ADJUSTMENT') && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">To Warehouse</label>
                <select 
                  required 
                  value={toWarehouse} 
                  onChange={(e) => setToWarehouse(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="">-- Select Destination --</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* SMART PRODUCT SEARCH */}
            <div className="md:col-span-2 relative" ref={searchRef}>
              <label className="block text-sm font-bold text-slate-700 mb-1">Find Product (Scan Barcode or Type)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                    if (selectedProduct) {
                      setSelectedProduct(null);
                      setBatchNumber('');
                    }
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className={`w-full border ${selectedProduct ? 'border-teal-500 bg-teal-50/30' : 'border-slate-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none`} 
                  placeholder="Scan PCS/Box barcode, or type product name..." 
                />
                {selectedProduct && (
                  <span className="absolute right-3 top-3.5 text-teal-600 font-bold text-sm flex items-center gap-1">
                    <span>✓</span> Selected
                  </span>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {showSearchDropdown && searchQuery && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-auto divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <li className="p-4 text-center text-slate-500 text-sm">No products found for "{searchQuery}"</li>
                  ) : (
                    filteredProducts.map(p => (
                      <li 
                        key={p.id} 
                        onClick={() => {
                          setSelectedProduct(p);
                          setSearchQuery(p.name);
                          setShowSearchDropdown(false);
                          setBatchNumber('');
                        }}
                        className="p-3 hover:bg-teal-50 cursor-pointer transition-colors"
                      >
                        <div className="font-bold text-slate-800">{p.name} <span className="text-xs font-normal text-slate-400 ml-1">({p.sku})</span></div>
                        <div className="text-xs font-mono text-slate-500 mt-1 flex gap-3">
                          <span>📦 Box: {p.barcodeBox || 'N/A'}</span>
                          <span>🏷️ PCS: {p.barcodePcs || 'N/A'}</span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* DYNAMIC BATCH SELECTION */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Batch Number</label>
              {type === 'ADJUSTMENT' ? (
                <input 
                  required 
                  type="text" 
                  value={batchNumber} 
                  onChange={(e) => setBatchNumber(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="Enter new batch (e.g., B-NEW)" 
                />
              ) : (
                <select 
                  required 
                  value={batchNumber} 
                  onChange={(e) => setBatchNumber(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  disabled={!selectedProduct}
                >
                  <option value="">{selectedProduct ? '-- Select Available Batch --' : 'Select a product first'}</option>
                  
                  {selectedProduct?.inventories?.filter((inv: any) => fromWarehouse ? inv.warehouseId === Number(fromWarehouse) : true).map((inv: any) => (
                    <option key={inv.id} value={inv.batchNumber}>
                      {/* 🔥 NEW: Shows actual Warehouse Name instead of ID! */}
                      {inv.batchNumber} (Available: {inv.quantity} in {getWarehouseName(inv.warehouseId)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* UNIT COST — ADJUSTMENT only. Values this stock for the GL (Inventory vs
                Inventory Adjustment posting) instead of silently defaulting to 0/untracked. */}
            {type === 'ADJUSTMENT' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Unit Cost (QAR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Leave blank if unknown"
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
              <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Amount to move" />
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Reason / Notes (Optional)</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g., Damaged boxes, routine transfer..." />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-lg py-4 rounded-xl shadow-md transition-all">
            {loading ? 'Processing Operation...' : 'Confirm Operation'}
          </button>
        </form>
      </div>
    </div>
  );
}