import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export type CompanySettings = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  logoUrl: string | null;
  footerNote: string | null;
  termsAndConditions: string | null;
  reportShowLogo: boolean;
  reportShowAddress: boolean;
  reportShowPhone: boolean;
  reportShowEmail: boolean;
  reportShowWebsite: boolean;
  reportShowFooter: boolean;
  reportHeaderColor: string;
  reportAccentColor: string;
  reportOrientation: string;
  reportDensity: string;
  reportBorderStyle: string;
  reportFieldsJson: Record<string, string[]>;

  posDefaultWarehouseId: number | null;
  posDefaultPaymentMethodId: number | null;
  posRequireCustomer: boolean;
  posReceiptFooter: string | null;
  posAutoPrintReceipt: boolean;
  posMaxDiscountPercent: number | null;
  posRequireCashCount: boolean;
};

// Server-side fetch of the single company-settings row — used by every print page (letterhead)
// and the Settings > Company Profile / Report Designer pages themselves.
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/settings/company`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}
