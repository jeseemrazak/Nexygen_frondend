'use client'; 

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isWarehouseSectionActive = pathname?.includes('/dashboard/warehouses') || pathname?.includes('/dashboard/inventory');
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(isWarehouseSectionActive);

  const isSalesSectionActive = pathname?.includes('/dashboard/orders') || pathname?.includes('/dashboard/deliveries') || pathname?.includes('/dashboard/quotations') || pathname?.includes('/dashboard/sales-invoices');
  const [isSalesOpen, setIsSalesOpen] = useState(isSalesSectionActive);

  const isPurchasesSectionActive = pathname?.includes('/dashboard/purchases') || pathname?.includes('/dashboard/suppliers') || pathname?.includes('/dashboard/rfqs') || pathname?.includes('/dashboard/receipts') || pathname?.includes('/dashboard/bills');
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(isPurchasesSectionActive);

  const isPosSectionActive = pathname?.includes('/dashboard/pos');
  const [isPosOpen, setIsPosOpen] = useState(isPosSectionActive);

  const isPayrollSectionActive = pathname?.includes('/dashboard/payroll');
  const [isPayrollOpen, setIsPayrollOpen] = useState(isPayrollSectionActive);

  const isAccountingSectionActive = pathname?.includes('/dashboard/accounting');
  const [isAccountingOpen, setIsAccountingOpen] = useState(isAccountingSectionActive);

  const isExpensesSectionActive = pathname?.includes('/dashboard/expenses');
  const [isExpensesOpen, setIsExpensesOpen] = useState(isExpensesSectionActive);

  // 🔥 THE EXACT MENU STYLE YOU REQUESTED
  const linkStyle = "flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-teal-50 hover:text-teal-700 rounded-lg font-semibold transition-colors";
  
  // 🔥 THE PURPLE ICON STYLE
  const iconStyle = "w-6 h-6 text-black-600";

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      
      {/* Sidebar - Changed to bg-white so your text-gray-600 menus look great! */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-teal-600">Nexygen</h2>
          <p className="text-xs text-gray-400 mt-1">Command Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          
          <Link href="/dashboard" className={linkStyle}>
            <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Link>

          {/* SALES COLLAPSIBLE GROUP */}
          <div>

            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Sales</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isSalesOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isSalesOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/quotations"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/quotations') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Quotations
              </Link>

              <Link
                href="/dashboard/orders"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/orders') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Sales Orders
              </Link>

              <Link
                href="/dashboard/deliveries"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/deliveries') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Deliveries
              </Link>

              <Link
                href="/dashboard/sales-invoices"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/sales-invoices') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Sales Invoices
              </Link>
            </div>

          </div>

          {/* POS COLLAPSIBLE GROUP */}
          <div>

            <button
              onClick={() => setIsPosOpen(!isPosOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>POS</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isPosOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isPosOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/pos"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/pos' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Checkout
              </Link>

              <Link
                href="/dashboard/pos/sessions"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/pos/sessions' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Sessions
              </Link>

              <Link
                href="/dashboard/pos/sales"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/pos/sales' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Sales History
              </Link>

              <Link
                href="/dashboard/pos/staff"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/pos/staff' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Staff
              </Link>
            </div>

          </div>

          {/* PAYROLL COLLAPSIBLE GROUP */}
          <div>

            <button
              onClick={() => setIsPayrollOpen(!isPayrollOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3c0-1.657-2.686-3-6-3s-6 1.343-6 3" />
                </svg>
                <span>Payroll</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isPayrollOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isPayrollOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/payroll/employees"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/payroll/employees') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Employees
              </Link>

              <Link
                href="/dashboard/payroll/runs"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/payroll/runs') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Payroll Runs
              </Link>

              <Link
                href="/dashboard/payroll/loans"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/payroll/loans' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Loans
              </Link>

              <Link
                href="/dashboard/payroll/eos-gratuity"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/payroll/eos-gratuity' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                EOS Gratuity
              </Link>

              <Link
                href="/dashboard/payroll/config"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/payroll/config' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Settings
              </Link>
            </div>

          </div>

          <Link href="/dashboard/products" className={linkStyle}>
            <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </Link>

          <Link href="/dashboard/merchandisers" className={linkStyle}>
            <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Fleet Management
          </Link>

          {/* WAREHOUSE COLLAPSIBLE GROUP */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            
            <button 
              onClick={() => setIsWarehouseOpen(!isWarehouseOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Warehouses</span>
              </div>
              
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${isWarehouseOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 🔥 INCREASED max-h-64 so all 4 links fit! */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isWarehouseOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link 
                href="/dashboard/warehouses" 
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/warehouses' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                All Warehouses
              </Link>
              
              <Link 
                href="/dashboard/inventory" 
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/inventory' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Stock Report
              </Link>

              <Link
                href="/dashboard/inventory/valuation"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/inventory/valuation' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Stock Value
              </Link>

              {/* 🔥 NEW: Stock Operations */}
              <Link 
                href="/dashboard/inventory/transfer" 
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/inventory/transfer' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Stock Operations
              </Link>

              {/* 🔥 NEW: Audit Log */}
              <Link
                href="/dashboard/inventory/movements"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/inventory/movements' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Audit Log
              </Link>

            </div>

          </div>

          {/* PURCHASES COLLAPSIBLE GROUP */}
          <div className="pt-2">

            <button
              onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Purchases</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isPurchasesOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isPurchasesOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/purchases"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/purchases' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Purchase Orders
              </Link>

              <Link
                href="/dashboard/suppliers"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/suppliers' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Suppliers
              </Link>

              <Link
                href="/dashboard/rfqs"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/rfqs' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                RFQs
              </Link>

              <Link
                href="/dashboard/receipts"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/receipts' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Receipts
              </Link>

              <Link
                href="/dashboard/purchases/invoices"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/purchases/invoices' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Purchase Invoices
              </Link>
            </div>

          </div>

          {/* ACCOUNTING COLLAPSIBLE GROUP */}
          <div className="pt-2">

            <button
              onClick={() => setIsAccountingOpen(!isAccountingOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3v-6m-3 6v-1m-2 5h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Accounting</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isAccountingOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isAccountingOpen ? 'max-h-[40rem] opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/accounting"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/accounting' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Overview
              </Link>

              <Link
                href="/dashboard/accounting/accounts"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/accounts' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Chart of Accounts
              </Link>

              <Link
                href="/dashboard/accounting/journal"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/journal' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Journal Entries
              </Link>

              <Link
                href="/dashboard/accounting/ledger"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/ledger' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Ledger
              </Link>

              <Link
                href="/dashboard/accounting/trial-balance"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/trial-balance' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Trial Balance
              </Link>

              <Link
                href="/dashboard/accounting/reports"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/reports' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                P&amp;L / Balance Sheet
              </Link>

              <Link
                href="/dashboard/accounting/reports/ar-aging"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/reports/ar-aging' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                AR Aging
              </Link>

              <Link
                href="/dashboard/accounting/reports/ap-aging"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/reports/ap-aging' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                AP Aging
              </Link>

              <Link
                href="/dashboard/accounting/payments"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname?.startsWith('/dashboard/accounting/payments') ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Payments
              </Link>

              <Link
                href="/dashboard/accounting/partner-ledger"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/partner-ledger' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Partner Ledger
              </Link>

              <Link
                href="/dashboard/accounting/journals"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/journals' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Journals
              </Link>

              <Link
                href="/dashboard/accounting/payment-methods"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/accounting/payment-methods' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Payment Methods
              </Link>
            </div>

          </div>

          {/* EXPENSES COLLAPSIBLE GROUP */}
          <div className="pt-2">

            <button
              onClick={() => setIsExpensesOpen(!isExpensesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition font-semibold text-gray-600 hover:text-teal-700"
            >
              <div className="flex items-center gap-3">
                <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 12h12l-3-3m0 6l3-3" />
                </svg>
                <span>Expenses</span>
              </div>

              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isExpensesOpen ? 'rotate-180 text-teal-600' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpensesOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href="/dashboard/expenses"
                className={`block px-4 py-2 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm pl-[3.25rem] ${
                  pathname === '/dashboard/expenses' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                All Expenses
              </Link>

              <Link
                href="/dashboard/expenses/categories"
                className={`block px-4 py-2 mt-1 rounded-md hover:bg-teal-50 hover:text-teal-700 transition text-sm relative pl-[3.25rem] ${
                  pathname === '/dashboard/expenses/categories' ? 'text-teal-700 font-bold bg-teal-50' : 'text-gray-500'
                }`}
              >
                Categories
              </Link>
            </div>

          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          {/* Plain POST form, not a <Link> — logout must never be reachable via GET,
              since Next.js prefetches <Link> hrefs in the background. */}
          <form action="/logout" method="POST">
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg font-semibold transition-colors text-left">
              <svg className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}