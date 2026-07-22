import Letterhead from './Letterhead';
import { CompanySettings } from '@/lib/companySettings';

const formatQAR = (n: number) => new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' }).format(n);

export type DocumentLine = { description: string; [columnKey: string]: string | number | undefined };

// Any column whose key is 'unitPrice' or 'total' is formatted as currency; every other key
// (qty, batchNumber, expiryDate, ...) renders as plain text — lets manifest-style documents
// (Delivery/Receipt, which have no prices) reuse the same renderer as billing documents.
export type DocumentColumn = { key: string; label: string };

// Fixed-layout letterhead + line-items renderer shared by every Sales/Purchase document print
// page (Sales Order, Delivery, Invoice, Quotation, Purchase Order, Receipt, Bill, RFQ) — unlike
// the 6 tabular accounting reports, document layout isn't customizable field-by-field in the
// Report Designer, only the shared company letterhead (logo/address/etc.) is.
export default function DocumentPrintView({
  settings,
  title,
  number,
  date,
  party,
  partyLabel = 'Client',
  meta = [],
  lines,
  columns,
  totalAmount,
  statusBadge,
}: {
  settings: CompanySettings | null;
  title: string;
  number: string;
  date: string;
  party?: string;
  partyLabel?: string;
  meta?: { label: string; value: string }[];
  lines: DocumentLine[];
  columns: DocumentColumn[];
  totalAmount?: number;
  statusBadge?: string;
}) {
  const accent = settings?.reportAccentColor || '0D9488';
  const headerColor = settings?.reportHeaderColor || 'E0E0E0';

  return (
    <div className="print-area bg-white p-10 max-w-4xl mx-auto text-gray-900">
      <Letterhead settings={settings} title={title} subtitle={number} accentColor={accent} />

      <div className="flex justify-between items-start mb-6 text-sm">
        <div className="space-y-0.5">
          {party && (
            <p><span className="text-gray-500">{partyLabel}: </span><span className="font-bold">{party}</span></p>
          )}
          {meta.map((m) => (
            <p key={m.label}><span className="text-gray-500">{m.label}: </span><span className="font-bold">{m.value}</span></p>
          ))}
        </div>
        <div className="text-right space-y-0.5">
          <p><span className="text-gray-500">Date: </span><span className="font-bold">{date}</span></p>
          {statusBadge && <p className="mt-1 font-black" style={{ color: `#${accent}` }}>{statusBadge}</p>}
        </div>
      </div>

      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: `#${headerColor}` }}>
            <th className="py-2 px-3">Description</th>
            {columns.map((c) => (
              <th key={c.key} className={`py-2 px-3 ${c.key === 'unitPrice' || c.key === 'total' ? 'text-right' : 'text-left'}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-2 px-3">{line.description}</td>
              {columns.map((c) => (
                <td key={c.key} className={`py-2 px-3 ${c.key === 'unitPrice' || c.key === 'total' ? 'text-right' : 'text-left'}`}>
                  {c.key === 'unitPrice' || c.key === 'total'
                    ? (line[c.key] != null ? formatQAR(line[c.key] as number) : '')
                    : (line[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totalAmount != null && (
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td className="py-2 px-3 font-black" colSpan={columns.length}>Total</td>
              <td className="py-2 px-3 text-right font-black">{formatQAR(totalAmount)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {settings?.reportShowFooter && settings?.footerNote && (
        <p className="mt-8 text-xs text-gray-500 text-center">{settings.footerNote}</p>
      )}
      {settings?.termsAndConditions && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p className="font-bold mb-1">Terms &amp; Conditions</p>
          <p className="whitespace-pre-line">{settings.termsAndConditions}</p>
        </div>
      )}
    </div>
  );
}
