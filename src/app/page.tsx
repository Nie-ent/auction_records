import { getAuctionRecords } from '@/app/actions/auction'
import { PackageSearch, TrendingUp, DollarSign, Archive } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import DashboardCharts from '@/components/DashboardCharts'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const records = await getAuctionRecords()

  // Dashboard Calculations
  const totalItems = records.reduce((sum, r) => sum + r.amount, 0)
  const totalInvested = records.reduce((sum, record) => {
    const servicesList = (Array.isArray(record.services) ? record.services : []) as {name: string, price: number}[]
    const servicesTotal = servicesList.reduce((sSum, s) => sSum + Number(s.price), 0)
    return sum + (record.price * record.exchangeRate) + (record.feeThb || 0) + servicesTotal
  }, 0)

  const soldRecords = records.filter(r => r.soldPrice)
  
  const cogs = soldRecords.reduce((sum, record) => {
    const servicesList = (Array.isArray(record.services) ? record.services : []) as {name: string, price: number}[]
    const servicesTotal = servicesList.reduce((sSum, s) => sSum + Number(s.price), 0)
    return sum + (record.price * record.exchangeRate) + (record.feeThb || 0) + servicesTotal
  }, 0)
  
  const totalRevenue = records.reduce((sum, r) => sum + (r.soldPrice || 0), 0)
  const totalProfit = records.reduce((sum, r) => {
    if (r.soldPrice) {
      const servicesList = (Array.isArray(r.services) ? r.services : []) as {name: string, price: number}[]
      const servicesTotal = servicesList.reduce((sSum, s) => sSum + Number(s.price), 0)
      const cost = (r.price * r.exchangeRate) + (r.feeThb || 0) + servicesTotal
      return sum + (r.soldPrice - cost)
    }
    return sum
  }, 0)

  const totalOutstandingBalance = records.reduce((sum, r) => {
    if (r.depositThb != null && r.depositThb > 0) {
      const servicesList = (Array.isArray(r.services) ? r.services : []) as {name: string, price: number}[]
      const servicesTotal = servicesList.reduce((sSum, s) => sSum + Number(s.price), 0)
      const cost = (r.price * r.exchangeRate) + (r.feeThb || 0) + servicesTotal
      return sum + (cost - r.depositThb)
    }
    return sum
  }, 0)

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { borderRadius: '1rem', background: '#fff', color: '#333' } }} />
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight mb-2 flex items-center gap-3">
              <PackageSearch className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              Auction Records
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg">จัดการและติดตามกำไรจากการประมูลของคุณ</p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        {/* --- INVENTORY METRICS --- */}
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-4 px-1">ภาพรวมการลงทุน (สต็อกทั้งหมด)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-md shadow-indigo-500/30">
                <PackageSearch className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">รายการทั้งหมด</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {totalItems} <span className="text-lg text-zinc-400 font-normal">ชิ้น</span>
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-md shadow-purple-500/30">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">เงินลงทุนจม (สต็อกรวม)</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalInvested)}
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">ค้างชำระ (มัดจำ)</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight text-amber-600 dark:text-amber-500">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalOutstandingBalance)}
            </p>
          </div>
        </div>

        {/* --- SALES METRICS --- */}
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-4 px-1">ผลประกอบการ (เฉพาะชิ้นที่ขายออกแล้ว)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-500/30">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">ทุนของชิ้นที่ขายได้</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cogs)}
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-md shadow-blue-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">ยอดขายรวม</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalRevenue)}
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">กำไรสุทธิ</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', signDisplay: 'always' }).format(totalProfit)}
            </p>
          </div>
        </div>

        {/* --- CHARTS --- */}
        <DashboardCharts records={records} />

      </div>
    </div>
  )
}
