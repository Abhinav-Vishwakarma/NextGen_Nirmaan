'use client'

import { useState, useEffect } from 'react'
import { Upload as UploadIcon, File as FileIcon, CheckCircle, AlertCircle, X, User } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

const DUMMY_USERS = [
  { id: 'u1', name: 'Alice Smith', role: 'Compliance Officer' },
  { id: 'u2', name: 'Bob Johnson', role: 'Finance Manager' },
  { id: 'u3', name: 'Charlie Davis', role: 'Legal Advisor' }
]

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracted' | 'error'>('idle')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      if (docId) window.location.href = `/documents/${docId}?autoRun=true`
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, docId])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    if (file) {
      setShowUserModal(true)
    }
  }

  const confirmUpload = async (username: string) => {
    setShowUserModal(false)
    if (file) {
      await processFile(file, username)
    }
  }

  const processFile = async (selectedFile: File, uploadedBy: string) => {
    setStatus('uploading')
    setErrorMsg('')
    setCountdown(null)

    showToast({
      type: 'info',
      title: 'Uploading document…',
      message: `Extracting data from ${selectedFile.name}`,
    })

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('uploadedBy', uploadedBy)

      const uploadRes = await api.postFormData('/api/documents/upload', formData)
      
      setDocId(uploadRes.id)
      setExtractedData(uploadRes.extractedData)
      setStatus('extracted')
      setCountdown(5)

      showToast({
        type: 'success',
        title: 'Extraction complete!',
        message: `Invoice from ${uploadRes.extractedData?.vendor_name || 'unknown vendor'} is ready for compliance check.`,
      })
    } catch (err: any) {
      setStatus('error')
      const msg = err.message || 'Upload failed'
      setErrorMsg(msg)
      showToast({
        type: 'error',
        title: 'Upload failed',
        message: msg,
        duration: 6000,
      })
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto stagger-children relative">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Upload Document</h1>
          <p className="text-slate-400">Upload a GST invoice to automatically extract data and run compliance checks.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Zone */}
          <div 
            className={cn(
              "glass-card p-12 text-center rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center",
              (!file || status === 'idle') && !dragActive ? "border-dashed border-[#ffffff14]" : 
              dragActive ? "border-dashed border-blue-500 bg-blue-500/5" : "border-[#ffffff14]",
              status === 'uploading' && "opacity-50 pointer-events-none"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {!file || status === 'error' ? (
              <>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept="application/pdf,image/png,image/jpeg,image/webp" 
                  onChange={handleChange} 
                />
                
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <UploadIcon size={24} className={dragActive ? "text-blue-400" : "text-slate-400"} />
                </div>
                
                <h3 className="text-lg font-medium text-white mb-2">
                  Drop your invoice here
                </h3>
                
                <p className="text-sm text-slate-400 mb-6 px-12">
                  Support for PDF, PNG, JPG files up to 10MB
                </p>

                <label 
                  htmlFor="file-upload" 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Browse Files
                </label>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                  <FileIcon size={32} className="text-blue-400" />
                </div>
                
                <h3 className="text-lg font-medium text-white mb-2 line-clamp-1 break-all px-4">{file.name}</h3>
                <p className="text-slate-400 text-sm mb-8">Ready • {(file.size / 1024 / 1024).toFixed(2)} MB</p>

                {status === 'idle' ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFile(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                    >
                      <UploadIcon size={16} /> Submit Invoice
                    </button>
                  </div>
                ) : status === 'uploading' ? (
                  <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-blue-500 w-1/2 animate-shimmer rounded-full"></div>
                  </div>
                ) : status === 'extracted' ? (
                   <div className="text-emerald-400 flex flex-col items-center gap-2">
                     <CheckCircle size={32} className="mb-2" />
                     <span className="font-medium">File Uploaded & Extracted</span>
                   </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Extraction Result / Preview */}
          <div className="glass-card p-6 h-[500px] overflow-y-auto flex flex-col">
             {status === 'idle' && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <FileIcon size={48} className="mb-4 opacity-20" />
                    <p>Extracted data will appear here</p>
                 </div>
             )}

             {status === 'error' && (
                 <div className="h-full flex flex-col items-center justify-center text-red-400">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p>{errorMsg}</p>
                 </div>
             )}

             {status === 'extracted' && extractedData && (
                 <div className="animate-fade-in flex flex-col h-full">
                    <div className="flex items-center gap-2 text-emerald-400 mb-6">
                       <CheckCircle size={20} />
                       <h3 className="font-medium text-white">Data Extracted Successfully</h3>
                    </div>

                    <div className="space-y-4 text-sm flex-1">
                       <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                          <div className="text-slate-400 text-xs mb-1">Vendor</div>
                          <div className="text-white font-medium">{extractedData.vendor_name || 'N/A'}</div>
                          <div className="text-slate-500 text-xs mt-1">GSTIN: {extractedData.vendor_gstin || 'N/A'}</div>
                       </div>

                       <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                          <div className="text-slate-400 text-xs mb-1">Invoice Details</div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                             <div>
                               <div className="text-slate-500 text-xs">Number</div>
                               <div className="text-white">{extractedData.invoice_number || 'N/A'}</div>
                             </div>
                             <div>
                               <div className="text-slate-500 text-xs">Date</div>
                               <div className="text-white">{extractedData.invoice_date || 'N/A'}</div>
                             </div>
                          </div>
                       </div>

                       <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs">Total Taxable</span>
                            <span className="text-white font-medium">₹{extractedData.total_taxable_value}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400">
                            <span className="text-xs">Grand Total</span>
                            <span className="font-bold text-lg">₹{extractedData.grand_total}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-6">
                      {countdown !== null ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.location.href = `/documents/${docId}?autoRun=true`}
                            className="flex-1 px-6 py-3 bg-white text-black hover:bg-slate-200 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                          >
                             Running AI Compliance in {countdown}s...
                          </button>
                          <button 
                            onClick={() => setCountdown(null)}
                            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg font-medium transition-colors"
                            title="Cancel Auto-redirect"
                          >
                             <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => window.location.href = `/documents/${docId}?autoRun=true`}
                          className="w-full px-6 py-3 bg-white text-black hover:bg-slate-200 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                        >
                           Run AI Compliance Check
                        </button>
                      )}
                    </div>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Select Upload User</h2>
            <p className="text-sm text-slate-400 mb-6">Choose an identity for this upload (Demo feature)</p>
            
            <div className="space-y-3">
              {DUMMY_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => confirmUpload(user.name)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-slate-400 text-xs">{user.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
