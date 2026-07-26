import Link from 'next/link';

const iconBase = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconTag({ className }: { className?: string }) {
  return <svg {...iconBase} className={className}><path d="M12.5 3H5a2 2 0 00-2 2v7.5a2 2 0 00.6 1.4l9 9a2 2 0 002.8 0l7.5-7.5a2 2 0 000-2.8l-9-9a2 2 0 00-1.4-.6z" /><circle cx="8" cy="8" r="1.5" /></svg>;
}
function IconStorefront({ className }: { className?: string }) {
  return <svg {...iconBase} className={className}><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" /><path d="M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" /><path d="M9 21v-6h6v6" /></svg>;
}
function IconScale({ className }: { className?: string }) {
  return <svg {...iconBase} className={className}><path d="M12 3v18" /><path d="M7 21h10" /><path d="M5 7h5m-5 0l-2.5 5a2.5 2.5 0 005 0L5 7z" /><path d="M19 7h-5m5 0l2.5 5a2.5 2.5 0 01-5 0L19 7z" /></svg>;
}
function IconWarehouse({ className }: { className?: string }) {
  return <svg {...iconBase} className={className}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /><path d="M3 21h18" /><path d="M9 21v-5a1 1 0 011-1h4a1 1 0 011 1v5" /></svg>;
}

const TINT: Record<string, { bg: string; text: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

function ConfigCard({
  icon,
  title,
  description,
  href,
  actionLabel,
  tint = 'slate',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  tint?: keyof typeof TINT;
}) {
  const t = TINT[tint];
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className={`w-11 h-11 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <span className="text-teal-600 font-semibold text-sm mt-auto">{actionLabel} →</span>
    </Link>
  );
}

export default function ConfigurationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Catalog and warehouse settings shared across Products, POS, and Inventory.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ConfigCard
          icon={<IconTag className="w-5 h-5" />}
          title="Product Category"
          description="Catalog grouping used for reporting and organization."
          href="/dashboard/products/categories"
          actionLabel="Manage categories"
          tint="teal"
        />
        <ConfigCard
          icon={<IconStorefront className="w-5 h-5" />}
          title="POS Category"
          description="Controls how products are grouped and ordered on the checkout screen."
          href="/dashboard/products/pos-categories"
          actionLabel="Manage POS categories"
          tint="teal"
        />
        <ConfigCard
          icon={<IconScale className="w-5 h-5" />}
          title="Unit of Measurement"
          description="Pieces, Kilogram, Box, Litre — assignable to any product."
          href="/dashboard/products/units"
          actionLabel="Manage units"
          tint="amber"
        />
        <ConfigCard
          icon={<IconWarehouse className="w-5 h-5" />}
          title="Warehouse"
          description="Add a new storage location for stock and purchase receiving."
          href="/dashboard/warehouses/new"
          actionLabel="Add warehouse"
          tint="slate"
        />
      </div>
    </div>
  );
}
