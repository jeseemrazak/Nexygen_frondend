import { cookies } from 'next/headers';
import { getCompanySettings } from '@/lib/companySettings';
import { API_BASE_URL } from '@/lib/config';
import { updatePosSettings } from './actions';

async function getWarehouses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/warehouses`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getPaymentMethods() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/accounting/payment-methods?activeOnly=true`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function PosSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [settings, warehouses, paymentMethods] = await Promise.all([getCompanySettings(), getWarehouses(), getPaymentMethods()]);
  const hasError = resolvedSearchParams.error === 'true';
  const saved = resolvedSearchParams.saved === 'true';

  if (!settings) return <div className="p-8 text-center text-rose-500 font-bold">Failed to load POS settings.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Configure POS</h1>
        <p className="text-sm text-gray-500 mt-1">Defaults and guardrails for the checkout screen — nothing here changes what's already been sold, only new sales going forward.</p>
      </div>

      {hasError && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-sm text-red-700 font-medium">Failed to save. Please try again.</p></div>}
      {saved && <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-md"><p className="text-sm text-purple-700 font-medium">POS settings saved.</p></div>}

      <form action={updatePosSettings} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Checkout Defaults</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Default Warehouse</label>
                <select
                  name="posDefaultWarehouseId"
                  defaultValue={settings.posDefaultWarehouseId ?? ''}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white"
                >
                  <option value="">No default</option>
                  {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Default Payment Method</label>
                <select
                  name="posDefaultPaymentMethodId"
                  defaultValue={settings.posDefaultPaymentMethodId ?? ''}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white"
                >
                  <option value="">No default</option>
                  {paymentMethods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" name="posRequireCustomer" defaultChecked={settings.posRequireCustomer} className="w-4 h-4" />
              Require a customer to be selected before completing a sale
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Discounting</h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Max Discount Without Approval (%)</label>
            <input
              type="number"
              name="posMaxDiscountPercent"
              min="0"
              max="100"
              step="0.1"
              defaultValue={settings.posMaxDiscountPercent ?? ''}
              placeholder="No limit"
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
            />
            <p className="text-xs text-gray-500 mt-1">Staff will be blocked from completing a sale with a discount above this percentage of the subtotal. Leave blank for no limit.</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Receipts</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Receipt Footer Text</label>
              <input
                type="text"
                name="posReceiptFooter"
                defaultValue={settings.posReceiptFooter || ''}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" name="posAutoPrintReceipt" defaultChecked={settings.posAutoPrintReceipt} className="w-4 h-4" />
              Automatically open the receipt for printing after each sale
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Kitchen Printing</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" name="kotAutoPrint" defaultChecked={settings.kotAutoPrint} className="w-4 h-4" />
              Automatically open the kitchen ticket for printing when items are sent to the kitchen
            </label>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kitchen Ticket Footer Text</label>
              <input
                type="text"
                name="kotFooterText"
                defaultValue={settings.kotFooterText || ''}
                placeholder="e.g. Allergy? Ask your server."
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-black"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Cash Drawer</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <input type="checkbox" name="posRequireCashCount" defaultChecked={settings.posRequireCashCount} className="w-4 h-4" />
            Require a counted-cash amount before a session can be closed
          </label>
          <p className="text-xs text-gray-500 mt-1">Opening float and closing count are entered on the Sessions page — this only controls whether the count is mandatory.</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save POS Settings</button>
        </div>
      </form>
    </div>
  );
}
