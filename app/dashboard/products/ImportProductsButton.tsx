'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

export default function ImportProductsButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Helper to get auth cookie on the client side
  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const token = getCookie('nexygen_token');
        const res = await fetch(`${API_BASE_URL}/products/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ products: jsonData })
        });

        if (res.ok) {
          const result = await res.json();
          alert(result.message || 'Products imported successfully! ✅');
          
          // 🔥 Tell Next.js to instantly refresh the server data!
          router.refresh(); 
        } else {
          alert('Failed to import products.');
        }
      } catch (error) {
        alert('Error reading the Excel file.');
        console.error(error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-md shadow-sm border border-gray-300 transition flex items-center justify-center gap-2 w-full md:w-auto"
      >
        {isUploading ? '⏳ Uploading...' : 'Import'}
      </button>
    </>
  );
}