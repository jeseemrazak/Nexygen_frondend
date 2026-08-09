import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL, uploadUrl } from '@/lib/config';

// 1. Secure Server-Side Data Fetching (Accepts URL parameters)
async function getDashboardData(searchParams: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  const queryStr = new URLSearchParams(searchParams).toString();

  try {
    const res = await fetch(`${API_BASE_URL}/orders/dashboard/summary?${queryStr}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

async function getDocumentStatusSummary(searchParams: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  const { range, startDate, endDate } = searchParams || {};
  const queryStr = new URLSearchParams({
    ...(range ? { range } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }).toString();
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/document-status?${queryStr}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-50 text-blue-700',
  ACCEPTED: 'bg-purple-50 text-purple-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  CONVERTED: 'bg-purple-50 text-purple-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  DONE: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
  ORDERED: 'bg-blue-50 text-blue-700',
  RECEIVED: 'bg-purple-50 text-purple-700',
  UNPAID: 'bg-rose-50 text-rose-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  PAID: 'bg-purple-50 text-purple-700',
};

// --- Minimal inline icon set (kept dependency-free, matches the rest of the dashboard) ---
type IconProps = { className?: string };
const iconBase = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const IconTruck = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><rect x="1" y="7" width="13" height="8" rx="1" /><path d="M14 10h4l3 3v2h-3" /><circle cx="6" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></svg>
);
const IconClock = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const IconCheckCircle = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><circle cx="12" cy="12" r="9" /><polyline points="8,12.5 11,15.5 16,9" /></svg>
);
const IconUsers = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.3" /><path d="M15.3 14.2c2.5.4 4.5 2.6 4.7 5.3" /></svg>
);
const IconDocument = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><path d="M6 2.5h8l4 4v15H6z" /><path d="M14 2.5v4h4" /><line x1="9" y1="12" x2="17" y2="12" /><line x1="9" y1="16" x2="17" y2="16" /></svg>
);
const IconClipboard = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 2h6v4H9z" /><line x1="8" y1="11" x2="16" y2="11" /><line x1="8" y1="15" x2="16" y2="15" /></svg>
);
const IconBanknote = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><line x1="6" y1="9" x2="6.01" y2="9" /><line x1="18" y1="15" x2="18.01" y2="15" /></svg>
);
const IconInboxDown = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><path d="M12 3v10" /><polyline points="8,9 12,13 16,9" /><path d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4" /></svg>
);
const IconArchive = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><rect x="3" y="4" width="18" height="4.5" rx="1" /><path d="M5 8.5V19a1 1 0 001 1h12a1 1 0 001-1V8.5" /><line x1="10" y1="13" x2="14" y2="13" /></svg>
);
const IconReceipt = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><path d="M6 2h12v19l-3-2-3 2-3-2-3 2z" /><line x1="8.5" y1="7" x2="15.5" y2="7" /><line x1="8.5" y1="11" x2="15.5" y2="11" /></svg>
);
const IconAlertTriangle = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><path d="M12 3.5l9.5 16.5H2.5z" /><line x1="12" y1="9.5" x2="12" y2="14" /><line x1="12" y1="17" x2="12" y2="17.01" /></svg>
);
const IconEye = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>
);

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  );
}

const TINT: Record<string, { bg: string; text: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-purple-50', text: 'text-purple-600' },
  teal: { bg: 'bg-purple-50', text: 'text-purple-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

function MetricCard({
  icon,
  label,
  value,
  tint = 'slate',
  href,
  byStatus,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint?: keyof typeof TINT;
  href?: string;
  byStatus?: Record<string, number>;
}) {
  const t = TINT[tint];
  const body = (
    <div className="bg-white border border-slate-200 rounded-xl p-5 h-full flex flex-col gap-3 transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{value}</span>
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {byStatus && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {Object.entries(byStatus)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <span key={status} className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-600'}`}>
                {status} · {count}
              </span>
            ))}
          {Object.values(byStatus).every((c) => c === 0) && (
            <span className="text-[10px] text-slate-300">No records yet</span>
          )}
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

// 2. Helper function to format the created Date nicely
function formatDateTime(dateString: string) {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// 3. Helper function to calculate duration
function calculateTimeTaken(createdAt: string, updatedAt: string, status: string) {
  if (status !== 'DELIVERED') return 'In Progress...';
  const start = new Date(createdAt).getTime();
  const end = new Date(updatedAt).getTime();
  const diffInMs = end - start;
  const mins = Math.floor(diffInMs / 60000);
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

// 4. The Main Page Component
export default async function DashboardHomePage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const [data, docStatus] = await Promise.all([getDashboardData(resolvedParams), getDocumentStatusSummary(resolvedParams)]);

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 text-rose-500 font-semibold mt-10 max-w-2xl mx-auto flex flex-col items-center gap-3">
        <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Failed to connect to the backend server. Make sure NestJS is running on port 3002.</span>
      </div>
    );
  }

  const { kpis, merchandisersList = [], lowStockItems = [], recentOrders = [] } = data;
  const filterActive = Boolean(resolvedParams.range || resolvedParams.merchandiserId || resolvedParams.status);

  const selectClass = "bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-all cursor-pointer";
  const inputClass = "bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-all";
  const labelClass = "text-[11px] font-medium text-slate-500";

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 space-y-6 font-sans">

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of sales, purchasing, and field operations</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5 w-fit">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
          </span>
          Live data
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <form action="/dashboard" className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Date Range</label>
            <select name="range" defaultValue={resolvedParams.range || 'all'} className={selectClass}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Start Date</label>
            <input type="date" name="startDate" defaultValue={resolvedParams.startDate || ''} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>End Date</label>
            <input type="date" name="endDate" defaultValue={resolvedParams.endDate || ''} className={inputClass} />
          </div>

          <div className="hidden lg:block w-px self-stretch bg-slate-200" />

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Merchandiser</label>
            <select name="merchandiserId" defaultValue={resolvedParams.merchandiserId || 'ALL'} className={selectClass}>
              <option value="ALL">All Merchandisers</option>
              {merchandisersList.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Delivery Status</label>
            <select name="status" defaultValue={resolvedParams.status || 'ALL'} className={selectClass}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Apply Filters
            </button>
            <Link href="/dashboard" className={`font-semibold py-2 px-4 rounded-lg border transition-colors text-sm flex items-center justify-center ${filterActive ? 'text-slate-700 border-slate-300 hover:bg-slate-50' : 'text-slate-300 border-slate-200 pointer-events-none'}`}>
              Reset
            </Link>
          </div>
        </div>
      </form>

      {/* --- KEY METRICS --- */}
      <section>
        <SectionHeader title="Key Metrics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<IconTruck className="w-4.5 h-4.5" />} tint="slate" label="Total Orders" value={kpis.totalOrders} />
          <MetricCard icon={<IconClock className="w-4.5 h-4.5" />} tint="amber" label="Pending Operations" value={kpis.pendingOrders} />
          <MetricCard icon={<IconCheckCircle className="w-4.5 h-4.5" />} tint="emerald" label="Successfully Delivered" value={kpis.deliveredOrders} />
          <MetricCard icon={<IconUsers className="w-4.5 h-4.5" />} tint="teal" label="Active Merchandizers" value={kpis.activeMerchandisers} />
        </div>
      </section>

      {/* --- DOCUMENT PIPELINE --- */}
      {docStatus && (
        <section>
          <SectionHeader title="Document Pipeline" hint="Sales in teal · Purchasing in amber" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={<IconDocument className="w-4.5 h-4.5" />}
              tint="teal"
              label="Quotations"
              href="/dashboard/quotations"
              value={docStatus.quotations.total}
              byStatus={docStatus.quotations.byStatus}
            />
            <MetricCard
              icon={<IconClipboard className="w-4.5 h-4.5" />}
              tint="teal"
              label="Sales Orders"
              href="/dashboard/orders"
              value={docStatus.salesOrders.total}
              byStatus={docStatus.salesOrders.byStatus}
            />
            <MetricCard
              icon={<IconBanknote className="w-4.5 h-4.5" />}
              tint="teal"
              label="Invoices"
              href="/dashboard/sales-invoices"
              value={docStatus.invoices.total}
              byStatus={docStatus.invoices.byStatus}
            />
            <MetricCard
              icon={<IconInboxDown className="w-4.5 h-4.5" />}
              tint="amber"
              label="Purchase Orders"
              href="/dashboard/purchases"
              value={docStatus.purchaseOrders.total}
              byStatus={docStatus.purchaseOrders.byStatus}
            />
            <MetricCard
              icon={<IconArchive className="w-4.5 h-4.5" />}
              tint="amber"
              label="Purchase Receipts"
              href="/dashboard/receipts"
              value={docStatus.receipts.total}
            />
            <MetricCard
              icon={<IconReceipt className="w-4.5 h-4.5" />}
              tint="amber"
              label="Vendor Bills"
              href="/dashboard/purchases/invoices"
              value={docStatus.bills.total}
              byStatus={docStatus.bills.byStatus}
            />
          </div>
        </section>
      )}

      {/* --- MAIN SPLIT SCREEN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: LIVE DISPATCH BOARD */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <IconTruck className="w-4 h-4" />
              </span>
              Live Dispatch Log
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <IconTruck className="w-6 h-6" />
                </span>
                <p className="text-slate-600 font-semibold">No orders match these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your date range or status.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                  <tr className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">
                    <th className="py-3 px-5">Order ID</th>
                    <th className="py-3 px-5">Date & Time</th>
                    <th className="py-3 px-5">Merchandiser & Client</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-center">Time Taken</th>
                    <th className="py-3 px-5 text-center">Proof (POD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentOrders.map((order: any) => {

                    // Status badge
                    let badgeClass = "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20";
                    if (order.status === 'PENDING') badgeClass = "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
                    if (order.status === 'SHIPPED') badgeClass = "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
                    if (order.status === 'DELIVERED') badgeClass = "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Order ID */}
                        <td className="py-3.5 px-5 font-mono font-semibold text-slate-700">
                          #{order.id.toString().padStart(4, '0')}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-5">
                          <span className="text-[11px] font-medium text-slate-600">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </td>

                        {/* Merchandiser & Client */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-800">{order.clientName || 'Walk-in Client'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                              {(order.user?.name || '?').charAt(0).toUpperCase()}
                            </span>
                            {order.user?.name || `ID: ${order.userId}`}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${badgeClass}`}>
                            {order.status}
                          </span>
                        </td>

                        {/* Time Taken */}
                        <td className="py-3.5 px-5 text-center text-slate-600 font-mono text-xs font-semibold">
                          {calculateTimeTaken(order.createdAt, order.updatedAt, order.status)}
                        </td>

                        {/* Proof of Delivery */}
                        <td className="py-3.5 px-5 text-center">
                          {order.proofOfDelivery ? (
                            <a href={uploadUrl(order.proofOfDelivery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-purple-700 hover:text-purple-900 font-semibold bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md transition-all border border-purple-200">
                              <IconEye className="w-3.5 h-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LOW STOCK ALERTS */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">

          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <IconAlertTriangle className="w-4 h-4" />
              </span>
              Critical Alerts
            </h2>
            <span className="bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
              Total &lt; 20
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <IconCheckCircle className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-slate-800 font-semibold">All inventory is stable.</p>
                <p className="text-slate-500 text-sm mt-1">No critical stock alerts right now.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[65%]">{item.name}</p>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-lg font-bold text-rose-600 leading-none tabular-nums">{item.totalQuantity}</span>
                      <span className="text-[9px] uppercase tracking-wide text-rose-400 font-semibold mt-0.5">Units Left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
