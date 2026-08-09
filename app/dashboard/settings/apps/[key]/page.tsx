import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAppModule } from '@/lib/appModules';
import { updateModuleConfig } from '../actions';

export default async function ModuleConfigPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { key } = await params;
  const { saved, error } = await searchParams;
  const mod = await getAppModule(key);

  if (!mod) return notFound();
  if (!mod.isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">This module isn&apos;t installed yet.</p>
          <Link href="/dashboard/settings/apps" className="text-purple-600 hover:text-purple-800 font-bold text-sm mt-3 inline-block">
            ← Back to App Store
          </Link>
        </div>
      </div>
    );
  }

  const booleanFields = mod.configFields.filter((f) => f.type === 'boolean').map((f) => f.key);
  const boundAction = updateModuleConfig.bind(null, key);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Link href="/dashboard/settings/apps" className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-2 inline-block">
          ← Back to App Store
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{mod.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{mod.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>
          </div>
        </div>
      </div>

      {saved && <div className="bg-purple-50 text-purple-700 text-sm font-semibold px-4 py-3 rounded-lg">Settings saved.</div>}
      {error && <div className="bg-rose-50 text-rose-700 text-sm font-semibold px-4 py-3 rounded-lg">Failed to save settings.</div>}

      <form action={boundAction} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <input type="hidden" name="_booleanFields" value={booleanFields.join(',')} />
        {mod.configFields.map((field) => {
          const current = mod.config?.[field.key];
          if (field.type === 'boolean') {
            return (
              <label key={field.key} className="flex items-center gap-3 text-sm">
                <input type="checkbox" name={field.key} defaultChecked={Boolean(current)} className="w-4 h-4" />
                <span className="text-gray-700 font-medium">{field.label}</span>
              </label>
            );
          }
          if (field.type === 'select') {
            return (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                <select name={field.key} defaultValue={(current as string) || field.options?.[0]} className="w-full border border-gray-300 rounded-md p-2.5 text-black bg-white">
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type === 'password' ? 'password' : 'text'}
                name={field.key}
                defaultValue={(current as string) || ''}
                className="w-full border border-gray-300 rounded-md p-2.5 text-black"
              />
              {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
            </div>
          );
        })}

        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-md shadow-sm">
          Save Settings
        </button>
      </form>
    </div>
  );
}
