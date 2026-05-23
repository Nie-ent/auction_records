"use client"

import { AuctionRecord } from "@prisma/client"
import { useMemo } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format } from "date-fns"

export default function DashboardCharts({ records }: { records: AuctionRecord[] }) {
  const chartData = useMemo(() => {
    // We want to group by date (purchasedAt or soldAt)
    // To make it simple, let's group by soldAt for sales performance.
    // We will aggregate Profit and Revenue by month or by specific dates.
    const soldRecords = records.filter(r => r.soldPrice && r.soldAt)
    const grouped: Record<string, { date: string, revenue: number, profit: number, cost: number }> = {}

    // Sort by soldAt
    const sorted = [...soldRecords].sort((a, b) => new Date(a.soldAt!).getTime() - new Date(b.soldAt!).getTime())

    let cumulativeProfit = 0;
    const timeSeriesData: { date: string; profit: number; name?: string | null; cumulativeProfit?: number }[] = []

    sorted.forEach(r => {
      const d = format(new Date(r.soldAt!), 'dd/MM/yyyy')
      const cost = (r.price * r.exchangeRate) + (r.feeThb || 0)
      const profit = r.soldPrice! - cost
      const revenue = r.soldPrice!

      if (!grouped[d]) {
        grouped[d] = { date: d, revenue: 0, profit: 0, cost: 0 }
      }
      grouped[d].revenue += revenue
      grouped[d].cost += cost
      grouped[d].profit += profit

      cumulativeProfit += profit
      timeSeriesData.push({
        date: d,
        name: r.itemName || 'Item',
        profit: profit,
        cumulativeProfit: cumulativeProfit
      })
    })

    const barData = Object.values(grouped)

    // Calculate Average ROI Timeframe (Days to sell)
    let totalDays = 0
    let soldCount = 0
    soldRecords.forEach(r => {
      const pDate = new Date(r.purchasedAt || r.date)
      const sDate = new Date(r.soldAt!)
      const diffTime = Math.abs(sDate.getTime() - pDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      totalDays += diffDays
      soldCount++
    })
    const avgDaysToSell = soldCount > 0 ? Math.round(totalDays / soldCount) : 0

    return { barData, timeSeriesData, avgDaysToSell }
  }, [records])

  if (chartData.timeSeriesData.length === 0) {
    return (
      <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-zinc-500">
        ยังไม่มีข้อมูลการขายสำหรับสร้างกราฟ (ต้องมีการบันทึกราคาขายก่อน)
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ROI Timeframe */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-indigo-800 dark:text-indigo-300 font-semibold text-lg mb-1">ระยะเวลาคืนทุนเฉลี่ย (ROI Timeframe)</h3>
          <p className="text-indigo-600/80 dark:text-indigo-400/80 text-sm">เวลาเฉลี่ยตั้งแต่สั่งซื้อจนถึงวันที่ขายออก</p>
        </div>
        <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
          {chartData.avgDaysToSell} <span className="text-xl font-medium text-indigo-500/70">วัน</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Profit Line Chart */}
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-6">แนวโน้มกำไรสะสม</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.timeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number | string | readonly (string | number)[] | undefined) => [new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value)), 'กำไรสะสม']}
                />
                <Line type="monotone" dataKey="cumulativeProfit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales vs Cost Bar Chart */}
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-6">ยอดขายและต้นทุน (รายวัน)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number | string | readonly (string | number)[] | undefined, name: string | number | undefined) => [
                    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value)), 
                    name === 'revenue' ? 'ยอดขาย' : name === 'cost' ? 'ต้นทุน' : 'กำไร'
                  ]}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="ยอดขาย" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="ต้นทุน" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
