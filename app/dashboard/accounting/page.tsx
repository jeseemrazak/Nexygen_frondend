import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

async function getDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/accounting/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

const formatQAR = (amount: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(amount);

const KPI_STYLES: Record<string, { icon: string; text: string; bg: string }> = {
  receivables: { icon: '↙️', text: 'text-orange-700', bg: 'bg-orange-50' },
  payables: { icon: '↗️', text: 'text-rose-700', bg: 'bg-rose-50' },
  cash: { icon: '💰', text: 'text-purple-700', bg: 'bg-purple-50' },
  income: { icon: '📈', text: 'text-purple-700', bg: 'bg-purple-50' },
};

const JOURNAL_STYLES: Record<string, { icon: string; text: string; bg: string }> = {
  CASH: { icon: '💵', text: 'text-purple-700', bg: 'bg-purple-50' },
  BANK: { icon: '🏦', text: 'text-indigo-700', bg: 'bg-indigo-50' },
  SALE: { icon: '🧾', text: 'text-purple-700', bg: 'bg-purple-50' },
  PURCHASE: { icon: '📦', text: 'text-orange-700', bg: 'bg-orange-50' },
  MISC: { icon: '📋', text: 'text-slate-700', bg: 'bg-slate-50' },
};

function KpiCard({ label, value, styleKey }: { label: string; value: number; styleKey: string }) {
  const s = KPI_STYLES[styleKey];
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.bg} text-base mb-4`}>{s.icon}</div>
      <p className="text-xl font-bold text-gray-800">{formatQAR(value)}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function DocSummaryCard({
  title,
  icon,
  href,
  unpaid,
  partial,
  paid,
  outstandingAmount,
  overdueCount,
  overdueAmount,
}: {
  title: string;
  icon: string;
  href: string;
  unpaid: number;
  partial: number;
  paid: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}) {
  return (
    <Link href={href} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition-colors block h-full">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Unpaid</p>
          <p className="font-bold text-gray-700 text-sm mt-0.5">{unpaid}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Partial</p>
          <p className="font-bold text-amber-700 text-sm mt-0.5">{partial}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Paid</p>
          <p className="font-bold text-purple-700 text-sm mt-0.5">{paid}</p>
        </div>
      </div>
      <div className="h-px bg-gray-100 my-4" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Outstanding</p>
          <p className="font-bold text-orange-700 text-sm mt-0.5">{formatQAR(outstandingAmount)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Overdue ({overdueCount})</p>
          <p className={`font-bold text-sm mt-0.5 ${overdueCount > 0 ? 'text-rose-700' : 'text-gray-400'}`}>{formatQAR(overdueAmount)}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function AccountingOverviewPage() {
  const data = await getDashboard();

  if (!data) {
    return <div className="p-8 text-center text-rose-500 font-bold">Failed to load accounting dashboard.</div>;
  }

  const { kpis, salesInvoices, purchaseBills, payroll, journals } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Accounting Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Where the business stands financially, at a glance.</p>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Receivables" value={kpis.receivables} styleKey="receivables" />
        <KpiCard label="Total Payables" value={kpis.payables} styleKey="payables" />
        <KpiCard label="Cash + Bank" value={kpis.cashAndBank} styleKey="cash" />
        <KpiCard label="MTD Net Income" value={kpis.mtdNetIncome} styleKey="income" />
      </div>

      {/* DOCUMENT STATUS */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Document Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <DocSummaryCard
            title="Sales Invoices"
            icon="🧾"
            href="/dashboard/sales-invoices"
            unpaid={salesInvoices.unpaid}
            partial={salesInvoices.partial}
            paid={salesInvoices.paid}
            outstandingAmount={salesInvoices.outstandingAmount}
            overdueCount={salesInvoices.overdueCount}
            overdueAmount={salesInvoices.overdueAmount}
          />
          <DocSummaryCard
            title="Purchase Bills"
            icon="📦"
            href="/dashboard/purchases/invoices"
            unpaid={purchaseBills.unpaid}
            partial={purchaseBills.partial}
            paid={purchaseBills.paid}
            outstandingAmount={purchaseBills.outstandingAmount}
            overdueCount={purchaseBills.overdueCount}
            overdueAmount={purchaseBills.overdueAmount}
          />
          <Link href="/dashboard/payroll/runs" className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition-colors block h-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">👤</span>
              <h3 className="font-bold text-gray-800 text-sm">Payroll</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Draft Runs</p>
                <p className="font-bold text-gray-700 text-sm mt-0.5">{payroll.draftRuns}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Unpaid Runs</p>
                <p className={`font-bold text-sm mt-0.5 ${payroll.unpaidRuns > 0 ? 'text-rose-700' : 'text-gray-700'}`}>{payroll.unpaidRuns}</p>
              </div>
            </div>
            <div className="h-px bg-gray-100 my-4" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Salary Payable</p>
                <p className="font-bold text-orange-700 text-sm mt-0.5">{formatQAR(payroll.salaryPayable)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">GRSIA Payable</p>
                <p className="font-bold text-orange-700 text-sm mt-0.5">{formatQAR(payroll.grsiaPayable)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">EOS Accrual</p>
                <p className="font-bold text-gray-700 text-sm mt-0.5">{formatQAR(payroll.eosGratuityAccrual)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Employee Advances</p>
                <p className="font-bold text-gray-700 text-sm mt-0.5">{formatQAR(payroll.employeeAdvances)}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* JOURNALS */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Journals</h2>
        {journals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">No active journals.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {journals.map((row: any) => {
              const s = JOURNAL_STYLES[row.journal.type] || JOURNAL_STYLES.MISC;
              return (
                <div key={row.journal.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${s.bg} text-sm`}>{s.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{row.journal.name}</p>
                      <p className="text-[11px] text-gray-500">{row.journal.code} · {row.journal.type}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{row.isBalance ? 'Balance' : 'Total Posted'}</p>
                  <p className={`text-lg font-bold mt-0.5 ${s.text}`}>{formatQAR(row.amount)}</p>
                  <Link
                    href={`/dashboard/accounting/journal?journalId=${row.journal.id}&journalName=${encodeURIComponent(row.journal.name)}`}
                    className="mt-4 block text-center text-xs font-bold text-gray-600 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-md py-2 transition-colors"
                  >
                    Transactions
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
