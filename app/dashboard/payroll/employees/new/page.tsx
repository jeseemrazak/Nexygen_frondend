import Link from 'next/link';
import { createEmployee } from '../actions';

export default async function NewEmployeePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const hasError = resolvedParams.error === 'true';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Employee</h1>
          <p className="text-sm text-gray-500 mt-1">Register an employee's HR/payroll profile.</p>
        </div>
        <Link href="/dashboard/payroll/employees" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">Failed to create employee.</p>
          </div>
        )}

        <form action={createEmployee} className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hire Date</label>
                <input type="date" name="hireDate" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isQatari" className="w-4 h-4" />
              Qatari national (subject to GRSIA, not EOS gratuity)
            </label>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">2. ID Documents</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">QID Number</label>
                <input type="text" name="qidNumber" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">QID Expiry</label>
                <input type="date" name="qidExpiryDate" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Number</label>
                <input type="text" name="passportNumber" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Expiry</label>
                <input type="date" name="passportExpiryDate" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Visa Expiry</label>
                <input type="date" name="visaExpiryDate" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">3. Bank Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
                <input type="text" name="bankName" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">IBAN</label>
                <input type="text" name="iban" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black font-mono" />
              </div>
            </div>
          </div>

          <div className="bg-teal-50 p-6 rounded-md border border-teal-100">
            <h2 className="text-lg font-bold text-teal-900 mb-4">4. Salary Structure (QAR/month)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Basic Salary <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" name="basicSalary" required className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Housing Allowance</label>
                <input type="number" step="0.01" name="housingAllowance" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Transportation Allowance</label>
                <input type="number" step="0.01" name="transportationAllowance" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Telephone Allowance</label>
                <input type="number" step="0.01" name="telephoneAllowance" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-2">Other Allowance</label>
                <input type="number" step="0.01" name="otherAllowance" className="w-full border border-teal-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save Employee</button>
          </div>
        </form>
      </div>
    </div>
  );
}
