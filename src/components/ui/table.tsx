"use client"

import { format } from 'date-fns'
import { deleteAuctionRecord, updateAuctionRecordSoldPrice } from '@/app/actions/auction'
import { useTransition, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Edit3, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

type AuctionRecord = {
  id: string
  date: Date
  imageUrl: string
  amount: number
  price: number
  exchangeRate: number
  soldPrice: number | null
  depositThb: number | null
  feeThb: number | null
  services?: { name: string; price: number }[] | null
  purchasedAt?: Date | null
  receivedAt?: Date | string | null
  soldAt?: Date | null
  itemName?: string | null
}

export default function AuctionRecordTable({ records }: { records: AuctionRecord[] }) {
  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    // We format the date to a simple string to use as a key (e.g. "2026-05-28")
    const dateKey = format(new Date(record.purchasedAt || record.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(record)
    return acc
  }, {} as Record<string, AuctionRecord[]>)

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (records.length === 0) {
    return (
      <div className="w-full p-12 text-center text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl">
        ไม่พบรายการ เพิ่มรายการใหม่เพื่อเริ่มต้นใช้งาน!
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {sortedDates.map(dateKey => (
        <div key={dateKey} className="flex flex-col gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100 px-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            {format(new Date(dateKey), 'dd MMMM yyyy')}
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {groupedRecords[dateKey].length} รายการ
            </span>
          </h3>
          
          <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            {/* Smooth mobile scroll wrapper */}
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full text-[10px] sm:text-xs text-left">
                <thead className="text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 font-semibold whitespace-nowrap w-24">สินค้า</th>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 font-semibold whitespace-nowrap">ต้นทุนรวม</th>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 font-semibold whitespace-nowrap">ราคาขาย (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {groupedRecords[dateKey].map((record) => (
                    <TableRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TableRow({ record }: { record: AuctionRecord }) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Image Modal state
  const [showImageModal, setShowImageModal] = useState(false)

  // Edit mode state for sold price
  const [isEditingSoldPrice, setIsEditingSoldPrice] = useState(false)
  const [soldPriceInput, setSoldPriceInput] = useState(record.soldPrice?.toString() || '')

  // Edit record state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editItemName, setEditItemName] = useState(record.itemName || '')
  const [editPrice, setEditPrice] = useState(record.price)
  const [editExchangeRate, setEditExchangeRate] = useState(record.exchangeRate)
  const [editFeeThb, setEditFeeThb] = useState(record.feeThb || 0)
  const [editIsDeposit, setEditIsDeposit] = useState(record.depositThb !== null)
  const [editDepositThb, setEditDepositThb] = useState(record.depositThb?.toString() || '')
  const [editPurchasedAt, setEditPurchasedAt] = useState(record.purchasedAt ? new Date(record.purchasedAt).toISOString().split('T')[0] : '')
  const [editReceivedAt, setEditReceivedAt] = useState(record.receivedAt ? new Date(record.receivedAt).toISOString().split('T')[0] : '')
  const [editSoldAt, setEditSoldAt] = useState(record.soldAt ? new Date(record.soldAt).toISOString().split('T')[0] : '')
  const [editServices, setEditServices] = useState<{name: string, price: number}[]>(Array.isArray(record.services) ? record.services : [])

  // Sync deposit input when toggled in edit modal
  useEffect(() => {
    if (editIsDeposit && editPrice > 0 && !editDepositThb) {
      setEditDepositThb(((editPrice * editExchangeRate) / 2).toFixed(2))
    }
  }, [editPrice, editExchangeRate, editIsDeposit, editDepositThb])

  // Auto-calculate fee when editing price
  useEffect(() => {
    if (editPrice > 0) {
      setEditFeeThb(Number((editPrice * 0.03 + 40).toFixed(2)))
    } else {
      setEditFeeThb(40)
    }
  }, [editPrice])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const { deleteAuctionRecord } = await import('@/app/actions/auction')
        await deleteAuctionRecord(record.id)
        toast.success("ลบรายการสำเร็จ!")
      } catch (e) {
        toast.error("ลบรายการไม่สำเร็จ")
      }
    })
  }

  const handleSaveSoldPrice = () => {
    startTransition(async () => {
      try {
        await updateAuctionRecordSoldPrice(record.id, parseFloat(soldPriceInput) || 0)
        setIsEditingSoldPrice(false)
        toast.success("อัปเดตราคาขายสำเร็จ!")
      } catch (e) {
        toast.error("อัปเดตราคาขายไม่สำเร็จ")
      }
    })
  }

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const { updateAuctionRecord } = await import('@/app/actions/auction')
        await updateAuctionRecord(record.id, {
          itemName: editItemName.trim() || null,
          price: editPrice,
          exchangeRate: editExchangeRate,
          feeThb: editFeeThb > 0 ? editFeeThb : null,
          depositThb: editIsDeposit && editDepositThb ? parseFloat(editDepositThb) : null,
          purchasedAt: editPurchasedAt ? new Date(editPurchasedAt) : undefined,
          receivedAt: editReceivedAt ? new Date(editReceivedAt) : null,
          soldAt: editSoldAt ? new Date(editSoldAt) : null,
          services: editServices,
        })
        setShowEditModal(false)
        toast.success("อัปเดตข้อมูลสำเร็จ!")
      } catch (e) {
        toast.error("อัปเดตข้อมูลไม่สำเร็จ")
      }
    })
  }

  const rawThb = record.price * record.exchangeRate
  const servicesList = (Array.isArray(record.services) ? record.services : []) as {name: string, price: number}[]
  const servicesTotal = servicesList.reduce((sum, s) => sum + Number(s.price), 0)
  const estimatedThb = rawThb + (record.feeThb || 0) + servicesTotal

  return (
    <>
      <tr 
        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
        onClick={() => setShowEditModal(true)}
      >
        <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap w-24">
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10 hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                setShowImageModal(true)
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={record.imageUrl} alt="Item" className="w-full h-full object-cover" />
            </div>
            {record.itemName && (
              <div className="text-[10px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 max-w-[80px] text-center truncate" title={record.itemName}>
                {record.itemName}
              </div>
            )}
            <div className="flex flex-col items-center w-full mt-0.5">
              {record.soldPrice ? (
                <div className="flex flex-col items-center">
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full text-center mb-0.5">ขายแล้ว</span>
                  {record.receivedAt && <span className="text-[9px] text-zinc-500">รับ: {format(new Date(record.receivedAt), 'dd MMM')}</span>}
                  {record.soldAt && <span className="text-[9px] text-zinc-500">ขาย: {format(new Date(record.soldAt), 'dd MMM')}</span>}
                </div>
              ) : record.receivedAt ? (
                <div className="flex flex-col items-center">
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full text-center mb-0.5">ได้รับแล้ว</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400">รับ: {format(new Date(record.receivedAt), 'dd MMM')}</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded-full text-center">ยังไม่ได้รับ</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(estimatedThb)}
            </span>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 leading-tight space-y-0.5">
              <div>{new Intl.NumberFormat('ja-JP').format(record.price)} เยน (เรท {record.exchangeRate})</div>
              {record.feeThb ? <div className="text-rose-500 dark:text-rose-400">+ ค่าดำเนินการ ฿{record.feeThb}</div> : null}
              {servicesList.length > 0 && (
                <div className="text-indigo-500 dark:text-indigo-400">
                  {servicesList.map((s, i) => (
                    <div key={i}>+ {s.name} ฿{s.price}</div>
                  ))}
                </div>
              )}
              {record.depositThb ? <div className="text-amber-600 dark:text-amber-500">มัดจำแล้ว: ฿{record.depositThb}</div> : null}
            </div>
          </div>
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsEditingSoldPrice(true); }}>
              <span className={`font-medium ${record.soldPrice ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 italic'}`}>
                {record.soldPrice 
                  ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(record.soldPrice) 
                  : 'ยังไม่ขาย'}
              </span>
              <button
                className="p-1.5 text-zinc-400 hover:text-indigo-600 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md opacity-0 group-hover/edit:opacity-100 transition-opacity"
                title="แก้ไขราคาขาย"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Show Profit if sold */}
            {record.soldPrice && (
              <div className={`text-[10px] sm:text-xs mt-1 font-medium ${record.soldPrice - estimatedThb >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                กำไร: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', signDisplay: 'always' }).format(record.soldPrice - estimatedThb)}
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Edit Record Modal */}
      {mounted && showEditModal && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl max-w-md w-full border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">แก้ไขข้อมูลต้นทุน</h3>
            <form onSubmit={handleUpdateRecord} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ชื่อสินค้า <span className="text-xs text-zinc-400">(ไม่บังคับ)</span></label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">วันที่ซื้อ</label>
                  <input
                    type="date"
                    required
                    value={editPurchasedAt}
                    onChange={(e) => setEditPurchasedAt(e.target.value)}
                    className="w-full max-w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">วันที่ได้รับ <span className="text-xs text-zinc-400">(ถ้ามี)</span></label>
                  <input
                    type="date"
                    value={editReceivedAt}
                    onChange={(e) => setEditReceivedAt(e.target.value)}
                    className="w-full max-w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">วันที่ขาย <span className="text-xs text-zinc-400">(ถ้ามี)</span></label>
                  <input
                    type="date"
                    value={editSoldAt}
                    onChange={(e) => setEditSoldAt(e.target.value)}
                    className="w-full max-w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ราคา (เยน)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice || ''}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">อัตราแลกเปลี่ยน</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={editExchangeRate || ''}
                    onChange={(e) => setEditExchangeRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`editDeposit-${record.id}`}
                      checked={editIsDeposit}
                      onChange={(e) => {
                        setEditIsDeposit(e.target.checked)
                        if (!e.target.checked) setEditDepositThb('')
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                    />
                    <label htmlFor={`editDeposit-${record.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      มัดจำค้างจ่าย
                    </label>
                  </div>
                  {editIsDeposit && (
                    <input
                      type="number"
                      step="0.01"
                      placeholder="มัดจำ (บาท)"
                      value={editDepositThb}
                      onChange={(e) => setEditDepositThb(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ค่าดำเนินการ (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFeeThb || ''}
                    onChange={(e) => setEditFeeThb(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Extra Services Edit Section */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    บริการซ่อม/ตกแต่งเพิ่มเติม
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditServices([...editServices, { name: '', price: 0 }])}
                    className="text-xs font-medium px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                  >
                    + เพิ่มบริการ
                  </button>
                </div>
                
                {editServices.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {editServices.map((srv, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-[2]">
                          <input
                            type="text"
                            placeholder="ชื่อบริการ (เช่น ทำสปา, เซ็ตอัพ)"
                            value={srv.name}
                            onChange={(e) => {
                              const newSrv = [...editServices]
                              newSrv[idx].name = e.target.value
                              setEditServices(newSrv)
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="ราคา (฿)"
                            value={srv.price || ''}
                            onChange={(e) => {
                              const newSrv = [...editServices]
                              newSrv[idx].price = parseFloat(e.target.value) || 0
                              setEditServices(newSrv)
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSrv = [...editServices]
                            newSrv.splice(idx, 1)
                            setEditServices(newSrv)
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editServices.length > 0 && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                    รวม: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{editServices.reduce((sum, s) => sum + s.price, 0).toLocaleString()} ฿</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 pb-2 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 z-10 -mb-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                >
                  ลบรายการ
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50 min-w-[80px]"
                  >
                    {isPending ? 'รอสักครู่...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal via Portal */}
      {mounted && showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">ยืนยันการลบรายการ?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  handleDelete()
                }}
                disabled={isPending}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-colors"
              >
                {isPending ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Fullscreen Modal */}
      {mounted && showImageModal && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={record.imageUrl} 
              alt="Enlarged Item" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Sold Price Modal */}
      {mounted && isEditingSoldPrice && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">อัปเดตราคาขาย (บาท)</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              ใส่ยอด 0 บาทหากต้องการยกเลิกสถานะขายแล้ว
            </p>
            
            <input
              type="number"
              step="0.01"
              value={soldPriceInput}
              onChange={(e) => setSoldPriceInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 text-lg rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 dark:text-white mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSoldPrice()
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingSoldPrice(false)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSoldPrice}
                disabled={isPending}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-colors"
              >
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
