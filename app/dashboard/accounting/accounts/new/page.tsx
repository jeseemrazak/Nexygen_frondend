import { createAccount } from '../actions';
import Link from 'next/link';

export default function NewAccountPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === 'true';

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Account</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new account to the Chart of Accounts.</p>
        </div>
        <Link
          href="/dashboard/accounting/accounts"
          className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">

        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">
              Failed to create account. The code may already be in use.
            </p>
          </div>
        )}

        <form action={createAccount} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                required
                placeholder="e.g., 1050"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select name="type" required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black bg-white">
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g., Petty Cash"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm"
            >
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
