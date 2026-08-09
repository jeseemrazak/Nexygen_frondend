import { getCompanySettings } from '@/lib/companySettings';
import { uploadUrl } from '@/lib/config';
import { updateCompanyProfile, uploadCompanyLogo } from './actions';

export default async function CompanySettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const settings = await getCompanySettings();
  const hasError = resolvedSearchParams.error === 'true';
  const saved = resolvedSearchParams.saved === 'true';

  if (!settings) return <div className="p-8 text-center text-rose-500 font-bold">Failed to load company settings.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Company Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Shown on every printed document and report — logo, contact details, terms, and footer.</p>
      </div>

      {hasError && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-sm text-red-700 font-medium">Failed to save. Please try again.</p></div>}
      {saved && <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-md"><p className="text-sm text-purple-700 font-medium">Settings saved.</p></div>}

      {/* LOGO */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uploadUrl(settings.logoUrl)} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-300 text-3xl">🏢</span>
            )}
          </div>
          <form action={uploadCompanyLogo} className="flex-1 flex items-center gap-3">
            <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="text-sm text-black" />
            <button type="submit" className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-5 rounded-md text-sm whitespace-nowrap">
              Upload
            </button>
          </form>
        </div>
      </div>

      {/* PROFILE FORM */}
      <form action={updateCompanyProfile} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Company Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</label>
              <input type="text" name="name" defaultValue={settings.name} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
              <textarea name="address" defaultValue={settings.address || ''} rows={2} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input type="text" name="phone" defaultValue={settings.phone || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input type="email" name="email" defaultValue={settings.email || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                <input type="text" name="website" defaultValue={settings.website || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tax / CR Number</label>
                <input type="text" name="taxNumber" defaultValue={settings.taxNumber || ''} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Report Footer</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Footer Note</label>
              <input type="text" name="footerNote" defaultValue={settings.footerNote || ''} placeholder="e.g. Thank you for your business" className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Terms &amp; Conditions</label>
              <textarea name="termsAndConditions" defaultValue={settings.termsAndConditions || ''} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-3 text-black" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Report Appearance</h2>
          <p className="text-sm text-gray-500 mb-3">What shows in the letterhead of every printed document and report.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'reportShowLogo', label: 'Show Logo', checked: settings.reportShowLogo },
              { key: 'reportShowAddress', label: 'Show Address', checked: settings.reportShowAddress },
              { key: 'reportShowPhone', label: 'Show Phone', checked: settings.reportShowPhone },
              { key: 'reportShowEmail', label: 'Show Email', checked: settings.reportShowEmail },
              { key: 'reportShowWebsite', label: 'Show Website', checked: settings.reportShowWebsite },
              { key: 'reportShowFooter', label: 'Show Footer Note', checked: settings.reportShowFooter },
            ].map((t) => (
              <label key={t.key} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input type="checkbox" name={t.key} defaultChecked={t.checked} className="w-4 h-4" />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md">Save Settings</button>
        </div>
      </form>
    </div>
  );
}
