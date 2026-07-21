import { createWarehouse } from './actions';
import Link from 'next/link';

export default function NewWarehousePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === 'true';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Warehouse</h1>
          <p className="text-sm text-gray-500 mt-1">Register a new storage location in the system.</p>
        </div>
        <Link 
          href="/dashboard/warehouses" 
          className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Form Area */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700 font-medium">
              Failed to create warehouse. Please check your connection and try again.
            </p>
          </div>
        )}

        <form action={createWarehouse} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Warehouse Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g., Central Distribution Center"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Location / City <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input 
              type="text" 
              name="location" 
              placeholder="e.g., Doha, Qatar"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-teal-500 focus:border-teal-500 text-black"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm"
            >
              Save Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}