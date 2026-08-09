import { cookies } from 'next/headers';
import { createCustomer } from './actions';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === 'true';

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const termsRes = await fetch(`${API_BASE_URL}/accounting/payment-terms?activeOnly=true`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const paymentTerms = termsRes.ok ? await termsRes.json() : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Customer</h1>
          <p className="text-sm text-gray-500 mt-1">Register a new client you sell to.</p>
        </div>
        <Link
          href="/dashboard/customers"
          className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">

        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">
              Failed to create customer. Please check your connection and try again.
            </p>
          </div>
        )}

        <form action={createCustomer} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g., City Center Mall"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g., Ahmed"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="e.g., +974 5555 1234"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="e.g., accounts@customer.com"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Address <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="address"
              placeholder="e.g., Industrial Area, Doha"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Payment Term <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <select
              name="paymentTermId"
              defaultValue=""
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            >
              <option value="">-- None --</option>
              {paymentTerms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.days} days)</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
