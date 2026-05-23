"use client"

import { createAuctionRecord } from '@/app/actions/auction'
import { useTransition, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, PlusCircle, Loader2, Info, UploadCloud, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

type ServiceEntry = { name: string; price: number }

const COMMON_SERVICES = [
  "ทำสปา / ทำความสะอาด",
  "เซ็ตอัพ / ตั้งทัชชิ่ง",
  "เปลี่ยนสายกีตาร์",
  "เปลี่ยนนัต / หย่อง",
  "ปรับระดับเฟรต",
  "เปลี่ยนเฟรตใหม่",
  "ซ่อมวงจรไฟฟ้า / เปลี่ยนปิคอัพ",
  "เปลี่ยนลูกบิด",
  "ซ่อมสี / รอยแตก",
]

export default function AuctionRecordForm() {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formDataCache, setFormDataCache] = useState<FormData | null>(null)
  
  // For live calculation
  const [itemName, setItemName] = useState<string>('')
  const [price, setPrice] = useState<number>(0)
  const [amount, setAmount] = useState<number>(1)
  const [exchangeRate, setExchangeRate] = useState<number>(0.23)
  const [feeThb, setFeeThb] = useState<number>(40)
  const [purchasedAt, setPurchasedAt] = useState<string>(new Date().toISOString().split('T')[0])
  const [receivedAt, setReceivedAt] = useState<string>('')
  const [isDeposit, setIsDeposit] = useState<boolean>(false)
  const [depositThb, setDepositThb] = useState<string>('')
  
  // Services
  const [services, setServices] = useState<ServiceEntry[]>([])

  // Auto-calculate 50% deposit if checked
  useEffect(() => {
    if (isDeposit && price > 0) {
      const half = (price * exchangeRate) / 2
      setDepositThb(half.toFixed(2))
    }
  }, [price, exchangeRate, isDeposit])

  // Auto-calculate fee: 0.03 of price + 40 THB service fee
  useEffect(() => {
    if (price > 0) {
      setFeeThb(Number((price * 0.03 + 40).toFixed(2)))
    } else {
      setFeeThb(40)
    }
  }, [price])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast.error("กรุณาเลือกรูปภาพเพื่ออัปโหลด")
      return
    }

    const formData = new FormData(e.currentTarget)
    setFormDataCache(formData)
    setShowConfirm(true) 
  }

  const confirmSubmit = () => {
    if (!formDataCache || !selectedFile) return
    setShowConfirm(false)
    setIsUploading(true)
    
    startTransition(async () => {
      try {
        // Upload image to Supabase Storage
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`auctions/${fileName}`, selectedFile)

        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(`auctions/${fileName}`)

        const payload = {
          itemName: itemName.trim() || null,
          price: parseFloat(formDataCache.get('price') as string) || 0,
          amount: parseInt(formDataCache.get('amount') as string) || 1,
          exchangeRate: parseFloat(formDataCache.get('exchangeRate') as string) || 0.23,
          depositThb: formDataCache.get('depositThb') ? parseFloat(formDataCache.get('depositThb') as string) : null,
          feeThb: formDataCache.get('feeThb') ? parseFloat(formDataCache.get('feeThb') as string) : null,
          purchasedAt: new Date(formDataCache.get('purchasedAt') as string),
          receivedAt: formDataCache.get('receivedAt') ? new Date(formDataCache.get('receivedAt') as string) : null,
          imageUrl: publicUrlData.publicUrl,
          services: services,
        }

        await createAuctionRecord(payload)
        formRef.current?.reset()
        setItemName('')
        setPrice(0)
        setAmount(1)
        setFeeThb(40)
        setDepositThb('')
        setIsDeposit(false)
        setServices([])
        setPurchasedAt(new Date().toISOString().split('T')[0])
        setReceivedAt('')
        setSelectedFile(null)
        setIsFormOpen(false) 
        toast.success("เพิ่มรายการสำเร็จ!")
      } catch (error: unknown) {
        console.error("Upload/Save Error:", error)
        const errMsg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
        toast.error(`บันทึกไม่สำเร็จ: ${errMsg}`)
      } finally {
        setIsUploading(false)
      }
    })
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all transform -translate-y-4"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Form Modal */}
      {mounted && isFormOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <PlusCircle className="text-indigo-500 w-6 h-6" />
                เพิ่มรายการใหม่
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form ref={formRef} onSubmit={handleInitialSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <label htmlFor="purchasedAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      วันที่สั่งซื้อ
                    </label>
                    <input
                      type="date"
                      name="purchasedAt"
                      id="purchasedAt"
                      value={purchasedAt}
                      onChange={(e) => setPurchasedAt(e.target.value)}
                      required
                      className="w-full max-w-full h-[50px] appearance-none px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label htmlFor="receivedAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      วันที่ได้รับสินค้า <span className="text-xs text-zinc-400">(ถ้ามี)</span>
                    </label>
                    <input
                      type="date"
                      name="receivedAt"
                      id="receivedAt"
                      value={receivedAt}
                      onChange={(e) => setReceivedAt(e.target.value)}
                      className="w-full max-w-full h-[50px] appearance-none px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    อัปโหลดรูปภาพ
                  </label>
                  <div className="relative w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all flex items-center justify-between overflow-hidden">
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      required
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <UploadCloud className="w-5 h-5 text-indigo-500" />
                      <span className="truncate max-w-[200px] text-sm">
                        {selectedFile ? selectedFile.name : "เลือกรูปภาพ..."}
                      </span>
                    </div>
                    {selectedFile && (
                      <div className="h-8 w-8 rounded-md bg-indigo-100 dark:bg-indigo-900 overflow-hidden flex-shrink-0 relative z-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    ชื่อสินค้า <span className="text-zinc-400 font-normal text-xs">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    id="itemName"
                    placeholder="เช่น Fender Stratocaster"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex-[2]">
                    <label htmlFor="price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ราคา (เยน)
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="flex-1">
                    <label htmlFor="exchangeRate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      เรท
                    </label>
                    <input
                      type="number"
                      name="exchangeRate"
                      id="exchangeRate"
                      step="0.0001"
                      required
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="isDeposit"
                        checked={isDeposit}
                        onChange={(e) => {
                          setIsDeposit(e.target.checked)
                          if (!e.target.checked) setDepositThb('')
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="isDeposit" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        จ่ายแค่มัดจำ (50%)
                      </label>
                    </div>
                    {isDeposit && (
                      <input
                        type="number"
                        name="depositThb"
                        id="depositThb"
                        step="0.01"
                        placeholder="0.00"
                        value={depositThb}
                        onChange={(e) => setDepositThb(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <label htmlFor="feeThb" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ค่าดำเนินการ (บาท) <span className="text-zinc-400 font-normal text-xs">(ถ้ามี)</span>
                    </label>
                    <input
                      type="number"
                      name="feeThb"
                      id="feeThb"
                      step="0.01"
                      placeholder="0.00"
                      value={feeThb || ''}
                      onChange={(e) => setFeeThb(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Extra Services Section */}
                <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      บริการซ่อม/ตกแต่งเพิ่มเติม (ถ้ามี)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setServices([...services, { name: '', price: 0 }])}
                      className="text-xs font-medium px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                    >
                      + เพิ่มบริการ
                    </button>
                  </div>
                  
                  {services.length > 0 && (
                    <div className="space-y-2">
                      {services.map((srv, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-[2]">
                            <input
                              type="text"
                              placeholder="ชื่อบริการ (เช่น ทำสปา, เซ็ตอัพ)"
                              value={srv.name}
                              onChange={(e) => {
                                const newSrv = [...services]
                                newSrv[idx].name = e.target.value
                                setServices(newSrv)
                              }}
                              list="common-services"
                              className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              placeholder="ราคา (฿)"
                              value={srv.price || ''}
                              onChange={(e) => {
                                const newSrv = [...services]
                                newSrv[idx].price = parseFloat(e.target.value) || 0
                                setServices(newSrv)
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSrv = [...services]
                              newSrv.splice(idx, 1)
                              setServices(newSrv)
                            }}
                            className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <datalist id="common-services">
                        {COMMON_SERVICES.map(cs => <option key={cs} value={cs} />)}
                      </datalist>
                    </div>
                  )}
                  {services.length > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                      รวมค่าบริการเพิ่มเติม: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{services.reduce((sum, s) => sum + s.price, 0).toLocaleString()} ฿</span>
                    </div>
                  )}
                </div>

                {/* Live Preview */}
                {price > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm mt-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>
                      ต้นทุนรวมสุทธิ: <strong>{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format((price * exchangeRate) + feeThb + services.reduce((sum, s) => sum + s.price, 0))}</strong>
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-6 pb-2 sticky bottom-0 bg-white dark:bg-zinc-900 z-10 -mb-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                  >
                    {isPending || isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isUploading ? 'กำลังอัปโหลด...' : 'กำลังบันทึก...'}
                      </>
                    ) : (
                      'เพิ่มรายการ'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Beautiful Confirmation Modal via Portal (z-index higher than form modal) */}
      {mounted && showConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-zinc-100 dark:border-zinc-800 transform transition-all scale-100 opacity-100">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ยืนยันการเพิ่มรายการ</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              คุณกำลังบันทึกรายการราคา <strong>{new Intl.NumberFormat('ja-JP').format(price)} เยน</strong> ที่อัตราแลกเปลี่ยน <strong>{exchangeRate}</strong><br/>
              {feeThb > 0 && <span>และมีค่าดำเนินการเพิ่มเติม <strong>฿{feeThb.toLocaleString()}</strong><br/></span>}
              <br/>
              ต้นทุนรวมโดยประมาณ: <strong className="text-indigo-600 dark:text-indigo-400">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format((price * exchangeRate) + feeThb)}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
