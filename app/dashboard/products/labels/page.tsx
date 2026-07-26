'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';
import { renderCode39SVG } from '@/lib/code39';
import PrintButton from '@/components/print/PrintButton';

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

type LabelLine = { productId: number; name: string; price: number; barcodeValue: string; copies: number };

export default function BarcodeLabelsPage() {
  const [loading, setLoading] = useState(true);
  const [moduleActive, setModuleActive] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lines, setLines] = useState<LabelLine[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [modRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/app-modules/barcode-label-printing`, { headers }),
        fetch(`${API_BASE_URL}/products`, { headers }),
      ]);
      if (modRes.ok) {
        const mod = await modRes.json();
        setModuleActive(mod.isActive);
        setConfig(mod.config || {});
      }
      if (prodRes.ok) setProducts(await prodRes.json());
      setLoading(false);
    };
    load();
  }, []);

  const barcodeSource = config.barcodeSource || 'sku';
  const showProductName = config.showProductName !== false;
  const showPrice = config.showPrice === true;
  const labelWidthMm = Number(config.labelWidthMm) > 0 ? Number(config.labelWidthMm) : 50;
  const labelHeightMm = Number(config.labelHeightMm) > 0 ? Number(config.labelHeightMm) : 30;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p: any) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcodePcs?.toLowerCase().includes(q) || p.barcodeBox?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, searchQuery]);

  const addProduct = (product: any) => {
    const barcodeValue = product[barcodeSource] || product.sku || String(product.id);
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) return prev;
      return [...prev, { productId: product.id, name: product.name, price: product.price, barcodeValue, copies: 1 }];
    });
    setSearchQuery('');
  };

  const updateCopies = (productId: number, copies: number) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, copies: Math.max(1, copies) } : l)));
  };

  const removeLine = (productId: number) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">Loading...</div>;
  }

  if (!moduleActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Barcode &amp; Label Printing module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-teal-600 hover:text-teal-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  const allLabels: LabelLine[] = lines.flatMap((l) => Array.from({ length: l.copies }, () => l));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="no-print bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Barcode Labels</h1>
          <p className="text-sm text-gray-500 mt-1">Search for a product, set how many copies, then print the label sheet.</p>
        </div>
        <PrintButton />
      </div>

      <div className="no-print bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-black"
          />
          {filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredProducts.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
                >
                  <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No products added yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase">Barcode Value</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase w-32">Copies</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((l) => (
                <tr key={l.productId}>
                  <td className="py-2 text-sm font-semibold text-gray-800">{l.name}</td>
                  <td className="py-2 text-sm font-mono text-gray-500">{l.barcodeValue}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={1}
                      value={l.copies}
                      onChange={(e) => updateCopies(l.productId, Number(e.target.value))}
                      className="w-20 border border-gray-300 rounded-md p-1.5 text-black text-sm"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeLine(l.productId)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {allLabels.length > 0 && (
        <div className="print-area bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-3">
            {allLabels.map((label, i) => {
              const svg = renderCode39SVG(label.barcodeValue);
              return (
                <div
                  key={`${label.productId}-${i}`}
                  style={{ width: `${labelWidthMm}mm`, height: `${labelHeightMm}mm` }}
                  className="border border-dashed border-gray-300 flex flex-col items-center justify-center p-1 overflow-hidden break-inside-avoid"
                >
                  {showProductName && <span className="text-[9px] font-bold text-gray-800 text-center leading-tight px-1">{label.name}</span>}
                  {svg ? (
                    <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
                  ) : (
                    <span className="text-[9px] text-gray-400">No barcode value</span>
                  )}
                  <span className="text-[8px] font-mono text-gray-600">{label.barcodeValue}</span>
                  {showPrice && <span className="text-[9px] font-bold text-teal-700">{formatQAR(label.price)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
