import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { updateEmployee } from '../../actions';

async function getEmployee(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

function toDateInput(value: string | null) {
  return value ? value.substring(0, 10) : '';
}

export default async function EditEmployeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const employee = await getEmployee(resolvedParams.id);
  const hasError = resolvedSearchParams.error === 'true';

  if (!employee) return <div className="p-8 text-center text-rose-500 font-bold">Employee not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Employee</h1>
          <p className="text-sm text-gray-500 mt-1">{employee.name}</p>
        </div>
        <Link href="/dashboard/payroll/employees" className="text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">Failed to update employee.</p>
          </div>
        )}

        <form action={updateEmployee} className="space-y-8">
          <input type="hidden" name="id" value={employee.id} />

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" defaultValue={employee.name} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hire Date</label>
                <input type="date" name="hireDate" defaultValue={toDateInput(employee.hireDate)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input type="checkbox" name="isQatari" defaultChecked={employee.isQatari} className="w-4 h-4" />
                Qatari national
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input type="checkbox" name="payrollActive" defaultChecked={employee.payrollActive} className="w-4 h-4" />
                Payroll active (included in future runs)
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">2. ID Documents</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">QID Number</label>
                <input type="text" name="qidNumber" defaultValue={employee.qidNumber || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">QID Expiry</label>
                <input type="date" name="qidExpiryDate" defaultValue={toDateInput(employee.qidExpiryDate)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Number</label>
                <input type="text" name="passportNumber" defaultValue={employee.passportNumber || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Expiry</label>
                <input type="date" name="passportExpiryDate" defaultValue={toDateInput(employee.passportExpiryDate)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Visa Expiry</label>
                <input type="date" name="visaExpiryDate" defaultValue={toDateInput(employee.visaExpiryDate)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">3. Bank Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
                <input type="text" name="bankName" defaultValue={employee.bankName || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">IBAN</label>
                <input type="text" name="iban" defaultValue={employee.iban || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black font-mono" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-md border border-purple-100">
            <h2 className="text-lg font-bold text-purple-900 mb-4">4. Salary Structure (QAR/month)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-purple-900 mb-2">Basic Salary <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" name="basicSalary" defaultValue={employee.basicSalary} required className="w-full border border-purple-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-900 mb-2">Housing Allowance</label>
                <input type="number" step="0.01" name="housingAllowance" defaultValue={employee.housingAllowance} className="w-full border border-purple-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-900 mb-2">Transportation Allowance</label>
                <input type="number" step="0.01" name="transportationAllowance" defaultValue={employee.transportationAllowance} className="w-full border border-purple-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-900 mb-2">Telephone Allowance</label>
                <input type="number" step="0.01" name="telephoneAllowance" defaultValue={employee.telephoneAllowance} className="w-full border border-purple-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-900 mb-2">Other Allowance</label>
                <input type="number" step="0.01" name="otherAllowance" defaultValue={employee.otherAllowance} className="w-full border border-purple-200 rounded-md px-4 py-3 text-black bg-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
