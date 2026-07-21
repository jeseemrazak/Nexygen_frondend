import { cookies } from 'next/headers';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

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
  const data = await getDashboardData(resolvedParams);

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

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ultimate Command Center</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">Real-time overview of metrics, inventory, and field dispatch operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Feed Active
          </div>
        </div>
      </div>

      {/* --- MASTER CONTROL TOOLBAR (THE FILTERS) --- */}
      <form action="/dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-5 items-end">
        
        {/* Global Date Filters */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Date Range</label>
          <select name="range" defaultValue={resolvedParams.range || 'all'} className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all font-medium cursor-pointer">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date (Use Below)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
          <input type="date" name="startDate" defaultValue={resolvedParams.startDate || ''} className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all font-medium" />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
          <input type="date" name="endDate" defaultValue={resolvedParams.endDate || ''} className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all font-medium" />
        </div>

        {/* Log Specific Filters */}
        <div className="flex flex-col gap-1.5 ml-auto">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Log: Merchandiser</label>
          <select name="merchandiserId" defaultValue={resolvedParams.merchandiserId || 'ALL'} className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium cursor-pointer">
            <option value="ALL">All Merchandisers</option>
            {merchandisersList.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Log: Status</label>
          <select name="status" defaultValue={resolvedParams.status || 'ALL'} className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div className="flex gap-2.5">
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm shadow-teal-600/20 transition-all flex items-center justify-center min-w-[120px]">
            Apply Filters
          </button>
          <Link href="/dashboard" className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg shadow-sm border border-slate-200 transition-all flex items-center justify-center">
            Reset
          </Link>
        </div>
      </form>

      {/* --- KPI SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-[4px] border-l-blue-500 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-[4px] border-l-amber-500 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Operations</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-[4px] border-l-emerald-500 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Successfully Delivered</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.deliveredOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-[4px] border-l-purple-500 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Active Fleet</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.activeMerchandisers}</p>
        </div>
      </div>

      {/* --- MAIN SPLIT SCREEN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIVE DISPATCH BOARD */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <span className="text-xl">🚚</span> Live Dispatch & Delivery Logs
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-4">📭</span>
                <p className="text-slate-500 font-bold text-lg">No orders match these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your date range or status.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-6">Merchandiser & Client</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Time Taken</th>
                    <th className="py-4 px-6 text-center">Proof (POD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentOrders.map((order: any) => {
                    
                    // Modern Badge Logic
                    let badgeClass = "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20";
                    if (order.status === 'PENDING') badgeClass = "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
                    if (order.status === 'SHIPPED') badgeClass = "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
                    if (order.status === 'DELIVERED') badgeClass = "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Order ID */}
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">
                          #{order.id.toString().padStart(4, '0')}
                        </td>
                        
                        {/* Created Date */}
                        <td className="py-4 px-6">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </td>

                        {/* Merchandiser & Client */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{order.clientName || 'Walk-in Client'}</div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                              👤
                            </span>
                            {order.user?.name || `ID: ${order.userId}`}
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${badgeClass}`}>
                            {order.status}
                          </span>
                        </td>
                        
                        {/* Time Taken */}
                        <td className="py-4 px-6 text-center text-slate-600 font-mono text-xs font-bold">
                          {calculateTimeTaken(order.createdAt, order.updatedAt, order.status)}
                        </td>
                        
                        {/* Proof of Delivery */}
                        <td className="py-4 px-6 text-center">
                          {order.proofOfDelivery ? (
                            <a href={`${API_BASE_URL}${order.proofOfDelivery}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-all border border-teal-200 shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
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
       {/* RIGHT COLUMN: LOW STOCK ALERTS */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          
          {/* THE HEADER YOU LOST */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/20"></span>
              <h2 className="text-lg font-extrabold text-slate-800">Critical Alerts</h2>
            </div>
            <span className="bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
              Total &lt; 20
            </span>
          </div>

          {/* THE NEW TOTAL STOCK LIST */}
          <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-slate-800 font-bold">All inventory is stable.</p>
                <p className="text-slate-500 text-sm mt-1">No critical stock alerts right now.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-all group">
                    <div className="max-w-[70%]">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-200 shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Total Stock
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xl font-black text-rose-600 leading-none tracking-tight">{item.totalQuantity}</span>
                      <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold mt-1">Units Left</span>
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