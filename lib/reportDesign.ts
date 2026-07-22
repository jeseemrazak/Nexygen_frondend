import { CompanySettings } from '@/lib/companySettings';

export type ReportFieldDef = { key: string; label: string };

// Every report type's full field catalog, in a fixed display order — the Report Designer only
// lets the user show/hide fields, not reorder them. Field keys match what each report print
// page maps its fetched data into (see the report's print/page.tsx).
export const REPORT_FIELD_CATALOG: Record<string, ReportFieldDef[]> = {
  trialBalance: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'subtype', label: 'Subtype' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
    { key: 'balance', label: 'Balance' },
  ],
  profitAndLoss: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'amount', label: 'Amount' },
  ],
  balanceSheet: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'amount', label: 'Amount' },
  ],
  generalLedger: [
    { key: 'date', label: 'Date' },
    { key: 'entryNo', label: 'Entry No' },
    { key: 'description', label: 'Description' },
    { key: 'party', label: 'Party' },
    { key: 'sourceType', label: 'Source' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
    { key: 'balance', label: 'Balance' },
  ],
  partnerLedger: [
    { key: 'date', label: 'Date' },
    { key: 'entryNo', label: 'Entry No' },
    { key: 'description', label: 'Description' },
    { key: 'sourceType', label: 'Source' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
    { key: 'balance', label: 'Balance' },
  ],
  agedReceivables: [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'party', label: 'Customer' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'amountPaid', label: 'Paid' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'daysOverdue', label: 'Days Overdue' },
    { key: 'bucket', label: 'Bucket' },
  ],
  agedPayables: [
    { key: 'invoiceNumber', label: 'Bill #' },
    { key: 'party', label: 'Supplier' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'amountPaid', label: 'Paid' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'daysOverdue', label: 'Days Overdue' },
    { key: 'bucket', label: 'Bucket' },
  ],
};

// Matches current on-screen behavior — nothing changes until the user customizes it in Report Designer.
export const REPORT_FIELD_DEFAULTS: Record<string, string[]> = {
  trialBalance: ['code', 'name', 'debit', 'credit', 'balance'],
  profitAndLoss: ['name', 'amount'],
  balanceSheet: ['name', 'amount'],
  generalLedger: ['date', 'entryNo', 'description', 'debit', 'credit', 'balance'],
  partnerLedger: ['date', 'entryNo', 'description', 'debit', 'credit', 'balance'],
  agedReceivables: ['invoiceNumber', 'party', 'invoiceDate', 'totalAmount', 'outstanding', 'bucket'],
  agedPayables: ['invoiceNumber', 'party', 'invoiceDate', 'totalAmount', 'outstanding', 'bucket'],
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  trialBalance: 'Trial Balance',
  profitAndLoss: 'Profit & Loss',
  balanceSheet: 'Balance Sheet',
  generalLedger: 'General Ledger',
  partnerLedger: 'Partner Ledger',
  agedReceivables: 'Aged Receivables (AR)',
  agedPayables: 'Aged Payables (AP)',
};

export const REPORT_ORIENTATIONS = ['portrait', 'landscape'] as const;
export const REPORT_DENSITIES = ['compact', 'normal', 'spacious'] as const;
export const REPORT_BORDER_STYLES = ['bordered', 'striped', 'minimal'] as const;

export const REPORT_COLOR_PRESETS: Record<string, string> = {
  Grey: 'E0E0E0',
  Indigo: '1A237E',
  Blue: '0D47A1',
  Teal: '0D9488',
  Green: '1B5E20',
  Purple: '4A148C',
  Red: 'B71C1C',
  Orange: 'E65100',
};

// This report type's currently-visible fields, in fixed catalog order.
export function getVisibleFields(settings: CompanySettings | null, reportKey: string): ReportFieldDef[] {
  const catalog = REPORT_FIELD_CATALOG[reportKey] || [];
  const catalogKeys = new Set(catalog.map((f) => f.key));
  const stored = settings?.reportFieldsJson?.[reportKey];
  const keys = stored && stored.length > 0 ? stored.filter((k) => catalogKeys.has(k)) : REPORT_FIELD_DEFAULTS[reportKey] || [];
  const byKey = new Map(catalog.map((f) => [f.key, f]));
  return keys.map((k) => byKey.get(k)).filter((f): f is ReportFieldDef => !!f);
}

export function getReportDensityStyle(density?: string) {
  switch (density) {
    case 'compact':
      return { padding: '4px 8px', fontSize: '11px' };
    case 'spacious':
      return { padding: '12px 16px', fontSize: '14px' };
    default:
      return { padding: '7px 12px', fontSize: '12.5px' };
  }
}
