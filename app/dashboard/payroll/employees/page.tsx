import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getEmployees() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  try {
    const res = await fetch(`${API_BASE_URL}/employees`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">HR/payroll records — separate from dashboard login accounts.</p>
        </div>
        <Link href="/dashboard/payroll/employees/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">
          ➕ Add Employee
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No employees yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nationality</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Basic Salary</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Total Allowances</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {employees.map((e: any) => {
                const totalAllowances = e.housingAllowance + e.transportationAllowance + e.telephoneAllowance + e.otherAllowance;
                return (
                  <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${!e.payrollActive ? 'opacity-50' : ''}`}>
                    <td className="py-4 px-6 font-bold text-gray-800">{e.name}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${e.isQatari ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {e.isQatari ? 'Qatari' : 'Expat'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm">{formatQAR(e.basicSalary)}</td>
                    <td className="py-4 px-6 text-right text-sm text-gray-600">{formatQAR(totalAllowances)}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${e.payrollActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {e.payrollActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/dashboard/payroll/employees/${e.id}/edit`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold transition">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
