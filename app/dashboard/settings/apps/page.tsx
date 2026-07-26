import Link from 'next/link';
import { getAppModules } from '@/lib/appModules';
import { installModule, uninstallModule } from './actions';

export default async function AppStorePage() {
  const modules = await getAppModules();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">App Store</h1>
        <p className="text-sm text-gray-500 mt-1">
          Optional modules you can install or remove at any time — nothing here affects your core ERP data.
        </p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-400">
          No apps available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => (
            <div key={m.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-800">{m.name}</h2>
                    {m.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">Installed</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{m.category} · v{m.version}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 flex-1">{m.description}</p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                {m.isActive ? (
                  <>
                    <Link
                      href={`/dashboard/settings/apps/${m.key}`}
                      className="text-teal-600 hover:text-teal-800 font-bold text-sm"
                    >
                      Configure
                    </Link>
                    <form action={uninstallModule.bind(null, m.key)}>
                      <button type="submit" className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
                        Uninstall
                      </button>
                    </form>
                  </>
                ) : (
                  <form action={installModule.bind(null, m.key)}>
                    <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-md text-sm shadow-sm">
                      Install
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
