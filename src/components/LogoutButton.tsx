"use client"

import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"

export default function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-100 dark:border-rose-500/20 shadow-sm"
    >
      <LogOut className="w-4 h-4" />
      <span>ออกจากระบบ</span>
    </button>
  )
}
