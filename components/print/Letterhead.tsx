import { CompanySettings } from '@/lib/companySettings';
import { API_BASE_URL } from '@/lib/config';

export default function Letterhead({
  settings,
  title,
  subtitle,
  accentColor,
}: {
  settings: CompanySettings | null;
  title: string;
  subtitle?: string;
  accentColor?: string;
}) {
  const accent = accentColor ? `#${accentColor}` : '#0D9488';
  const showLogo = settings?.reportShowLogo && settings?.logoUrl;

  return (
    <div className="mb-6 pb-4 border-b-2" style={{ borderColor: accent }}>
      <div className="flex justify-between items-start gap-6">
        <div className="flex items-center gap-4">
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_BASE_URL}${settings!.logoUrl}`} alt="Company logo" className="h-16 w-16 object-contain" />
          )}
          <div>
            <p className="font-black text-xl text-gray-900">{settings?.name || 'Company Name'}</p>
            <div className="text-xs text-gray-600 space-y-0.5 mt-1">
              {settings?.reportShowAddress && settings?.address && <p>{settings.address}</p>}
              <p>
                {settings?.reportShowPhone && settings?.phone && <span>{settings.phone}</span>}
                {settings?.reportShowPhone && settings?.phone && settings?.reportShowEmail && settings?.email && <span> · </span>}
                {settings?.reportShowEmail && settings?.email && <span>{settings.email}</span>}
              </p>
              {settings?.reportShowWebsite && settings?.website && <p>{settings.website}</p>}
              {settings?.taxNumber && <p>Tax/CR No: {settings.taxNumber}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-2xl" style={{ color: accent }}>{title}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
