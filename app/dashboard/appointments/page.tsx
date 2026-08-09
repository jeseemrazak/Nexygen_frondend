'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  NO_SHOW: 'bg-rose-50 text-rose-700',
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AppointmentsPage() {
  const [moduleActive, setModuleActive] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const fetchAppointments = async () => {
    const token = getClientToken();
    const qs = new URLSearchParams();
    if (staffFilter) qs.set('staffId', staffFilter);
    if (statusFilter) qs.set('status', statusFilter);
    const res = await fetch(`${API_BASE_URL}/appointments?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as any });
    if (res.ok) setAppointments(await res.json());
  };

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      try {
        const modRes = await fetch(`${API_BASE_URL}/app-modules/appointments`, { headers: { Authorization: `Bearer ${token}` } });
        const mod = modRes.ok ? await modRes.json() : null;
        setModuleActive(!!mod?.isActive);
        if (!mod?.isActive) { setLoading(false); return; }

        const usersRes = await fetch(`${API_BASE_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (usersRes.ok) setUsers(await usersRes.json());
        await fetchAppointments();
      } catch {
        setModuleActive(false);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (moduleActive) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffFilter, statusFilter]);

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [monthCursor]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const a of appointments) {
      const key = new Date(a.appointmentAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [appointments]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;

  if (!moduleActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Appointments module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-purple-600 hover:text-purple-800 font-bold text-sm mt-3 inline-block">
            ← Go to App Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Meetings, site visits, and calls with customers and leads.</p>
        </div>
        <Link href="/dashboard/appointments/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition">
          + Schedule
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${view === 'list' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'}`}>List</button>
          <button onClick={() => setView('calendar')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${view === 'calendar' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'}`}>Calendar</button>
        </div>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
          <option value="">All Staff</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No-show</option>
        </select>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No appointments found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date/Time</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">With</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Staff</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-black">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 text-sm">
                      <Link href={`/dashboard/appointments/${a.id}`} className="text-purple-600 hover:text-purple-800 font-bold">{fmtDateTime(a.appointmentAt)}</Link>
                    </td>
                    <td className="py-3 px-6 text-sm font-semibold">{a.title}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{a.customer?.name || a.lead?.name || '--'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{a.staff?.name || '--'}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[a.status]}`}>{a.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} className="px-3 py-1.5 rounded-md hover:bg-gray-100 font-bold text-gray-600">←</button>
            <h2 className="font-bold text-gray-800">{monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} className="px-3 py-1.5 rounded-md hover:bg-gray-100 font-bold text-gray-600">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 uppercase mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dayAppts = day ? apptsByDay.get(day.toDateString()) || [] : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`min-h-[90px] border rounded-md p-1.5 ${day ? 'border-gray-200' : 'border-transparent'}`}>
                  {day && (
                    <>
                      <p className={`text-xs font-bold mb-1 ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>{day.getDate()}</p>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 3).map((a) => (
                          <Link key={a.id} href={`/dashboard/appointments/${a.id}`} className={`block text-[10px] font-semibold px-1 py-0.5 rounded truncate ${STATUS_STYLES[a.status]}`}>
                            {a.title}
                          </Link>
                        ))}
                        {dayAppts.length > 3 && <p className="text-[10px] text-gray-400">+{dayAppts.length - 3} more</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
