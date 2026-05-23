import { getAuctionRecords } from '@/app/actions/auction'
import AuctionRecordTable from '@/components/ui/table'
import { PackageSearch } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
  const records = await getAuctionRecords()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-8">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { borderRadius: '1rem', background: '#fff', color: '#333' } }} />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight flex items-center gap-3">
              <PackageSearch className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              รายการสินค้าทั้งหมด
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-base mt-2">จัดการ แก้ไข ลบ รายการสินค้าและอัปเดตราคาขายของคุณ</p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-zinc-800 p-4 sm:p-6 rounded-3xl shadow-2xl">
            <AuctionRecordTable records={records} />
          </div>
        </div>

      </div>
    </div>
  )
}
