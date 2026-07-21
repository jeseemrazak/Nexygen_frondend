'use client';

import { cancelPosSale } from './actions';

export default function CancelSaleButton({ saleId }: { saleId: number }) {
  return (
    <form
      action={cancelPosSale}
      className="inline"
      onSubmit={(e) => {
        if (!confirm('Log this sale as cancelled? Stock and the GL entry are not reversed automatically.')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={saleId} />
      <button type="submit" className="text-rose-500 hover:text-rose-700 font-semibold text-xs underline">
        Cancel
      </button>
    </form>
  );
}
