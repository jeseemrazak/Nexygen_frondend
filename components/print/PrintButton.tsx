'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors"
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
