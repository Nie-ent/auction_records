"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, List, Plus } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"
import AuctionRecordForm from "./AuctionRecordForm" // We will modify AuctionRecordForm to be just the modal content, or we wrap it.
// Actually, AuctionRecordForm already includes a button and a modal.
// Let's make BottomNavigation handle the modal itself, or we can just render AuctionRecordForm and style its trigger button!

export default function BottomNavigation() {
  const pathname = usePathname()
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
        
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">ภาพรวม</span>
        </Link>

        {/* Center Floating Action Button */}
        <div className="flex-shrink-0">
          <AuctionRecordForm />
        </div>

        <Link 
          href="/items" 
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${pathname === '/items' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
        >
          <List className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">รายการ</span>
        </Link>

      </div>
    </div>
  )
}
