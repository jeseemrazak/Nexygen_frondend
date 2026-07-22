import Letterhead from './Letterhead';
import { CompanySettings } from '@/lib/companySettings';
import { getVisibleFields, getReportDensityStyle } from '@/lib/reportDesign';

const NUMERIC_KEYS = new Set(['debit', 'credit', 'balance', 'amount', 'totalAmount', 'amountPaid', 'outstanding', 'daysOverdue']);

function formatCell(key: string, value: any) {
  if (value === null || value === undefined || value === '') return '';
  if (NUMERIC_KEYS.has(key)) {
    return new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(Number(value));
  }
  return String(value);
}

// Generic renderer for the 6 tabular accounting reports (Trial Balance, P&L, Balance Sheet,
// General Ledger, Partner Ledger, Aged Receivables/Payables) — this is the one place all of
// Report Designer's settings (column visibility, colors, density, border style, orientation)
// actually apply. Every accounting report print page just fetches its existing data, maps each
// row into the field-catalog shape (see lib/reportDesign.ts), and renders this component.
export default function TabularReportView({
  settings,
  reportKey,
  title,
  dateRangeLabel,
  sectionLabel,
  hideLetterhead = false,
  rows,
  totals,
}: {
  settings: CompanySettings | null;
  reportKey: string;
  title: string;
  dateRangeLabel?: string;
  // Renders a small section heading instead of the full Letterhead — used when a page composes
  // several tables under one shared letterhead (e.g. P&L's Income + Expenses, Balance Sheet's
  // Assets + Liabilities + Equity).
  sectionLabel?: string;
  hideLetterhead?: boolean;
  rows: Record<string, any>[];
  totals?: Record<string, any>;
}) {
  const fields = getVisibleFields(settings, reportKey);
  const density = getReportDensityStyle(settings?.reportDensity);
  const headerColor = `#${settings?.reportHeaderColor || 'E0E0E0'}`;
  const accentColor = settings?.reportAccentColor || '0D9488';
  const borderStyle = settings?.reportBorderStyle || 'bordered';
  const striped = borderStyle === 'striped';
  const minimal = borderStyle === 'minimal';
  const landscape = settings?.reportOrientation === 'landscape';

  const cellBorder = minimal ? 'border-b border-gray-100' : 'border border-gray-200';
  const headerCellBorder = minimal ? 'border-b-2 border-gray-400' : 'border border-gray-300';

  const content = (
    <>
      {sectionLabel && <h3 className="font-black text-sm text-gray-700 uppercase tracking-wide mb-2 mt-6 first:mt-0">{sectionLabel}</h3>}
      <table className="w-full text-left border-collapse" style={{ fontSize: density.fontSize }}>
        <thead>
          <tr style={{ backgroundColor: headerColor }}>
            {fields.map((f) => (
              <th key={f.key} style={{ padding: density.padding }} className={`font-bold ${headerCellBorder} ${NUMERIC_KEYS.has(f.key) ? 'text-right' : 'text-left'}`}>
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={striped && i % 2 === 1 ? { backgroundColor: '#F8F8F8' } : undefined}>
              {fields.map((f) => (
                <td key={f.key} style={{ padding: density.padding }} className={`${cellBorder} ${NUMERIC_KEYS.has(f.key) ? 'text-right' : 'text-left'}`}>
                  {formatCell(f.key, row[f.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-black">
              {fields.map((f, i) => (
                <td key={f.key} style={{ padding: density.padding }} className={NUMERIC_KEYS.has(f.key) ? 'text-right' : 'text-left'}>
                  {i === 0 ? 'TOTAL' : formatCell(f.key, totals[f.key])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      {rows.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No data for this report.</p>}
    </>
  );

  if (hideLetterhead) return content;

  return (
    <div className={`print-area bg-white p-10 mx-auto text-gray-900 ${landscape ? 'print-landscape max-w-6xl' : 'max-w-4xl'}`}>
      <Letterhead settings={settings} title={title} subtitle={dateRangeLabel} accentColor={accentColor} />
      {content}
    </div>
  );
}
