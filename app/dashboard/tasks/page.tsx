'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getClientToken } from '@/lib/config';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
const STATUS_LABELS: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_STYLES: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  DONE: 'bg-purple-50 text-purple-700 border-purple-200',
};
const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-rose-50 text-rose-700',
};

function fmtDate(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TasksPage() {
  const [moduleActive, setModuleActive] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const fetchTasks = async (assignedToId?: string) => {
    const token = getClientToken();
    const qs = new URLSearchParams();
    if (assignedToId) qs.set('assignedToId', assignedToId);
    const res = await fetch(`${API_BASE_URL}/tasks?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as any });
    if (res.ok) setTasks(await res.json());
  };

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      try {
        const modRes = await fetch(`${API_BASE_URL}/app-modules/todo-list`, { headers: { Authorization: `Bearer ${token}` } });
        const mod = modRes.ok ? await modRes.json() : null;
        setModuleActive(!!mod?.isActive);
        if (!mod?.isActive) { setLoading(false); return; }

        const usersRes = await fetch(`${API_BASE_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (usersRes.ok) setUsers(await usersRes.json());
        await fetchTasks();
      } catch {
        setModuleActive(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (moduleActive) fetchTasks(assigneeFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigneeFilter]);

  const moveTask = async (id: number, status: string) => {
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchTasks(assigneeFilter || undefined);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;

  if (!moduleActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">The Todo List module isn&apos;t installed yet.</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Task Board</h1>
          <p className="text-sm text-gray-500 mt-1">Shared team tasks — anyone can create and assign.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black bg-white">
            <option value="">All Assignees</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
          <Link href="/dashboard/tasks/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition whitespace-nowrap">
            + New Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className={`px-4 py-3 border-b font-bold text-xs uppercase tracking-wider flex justify-between items-center ${STATUS_STYLES[status]}`}>
                <span>{STATUS_LABELS[status]}</span>
                <span className="bg-white/60 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
              </div>
              <div className="p-3 space-y-2 flex-1 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-1">Nothing here</p>
                ) : (
                  columnTasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <Link href={`/dashboard/tasks/${task.id}`} className="font-bold text-gray-800 text-sm hover:text-purple-700">{task.title}</Link>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                        {task.dueDate && <span className="text-[11px] text-gray-500">📅 {fmtDate(task.dueDate)}</span>}
                      </div>
                      {task.assignedTo && <p className="text-[11px] text-purple-600 font-semibold mt-1">👤 {task.assignedTo.name}</p>}
                      <div className="flex gap-1 mt-2">
                        {STATUSES.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={() => moveTask(task.id, s)}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-700 transition"
                          >
                            → {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
