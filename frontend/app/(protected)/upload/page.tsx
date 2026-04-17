'use client'

import { useState } from 'react'
import { Upload as UploadIcon, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracted' | 'error'>('idle')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setStatus('uploading')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadRes = await api.postFormData('/api/documents/upload', formData)
      
      setDocId(uploadRes.id)
      setExtractedData(uploadRes.extractedData)
      setStatus('extracted')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Upload failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto stagger-children">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Upload Document</h1>
        <p className="text-slate-400">Upload a GST invoice to automatically extract data and run compliance checks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Zone */}
        <div 
          className={cn(
            "glass-card p-12 text-center rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center",
            dragActive ? "border-blue-500 bg-blue-500/5" : "border-[#ffffff14]",
            status === 'uploading' && "opacity-50 pointer-events-none"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
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
            {status === 'uploading' ? 'Uploading & Extracting...' : 'Drop your invoice here'}
          </h3>
          
          {status === 'idle' && (
             <p className="text-sm text-slate-400 mb-6 px-12">
               Support for PDF, PNG, JPG files up to 10MB
             </p>
          )}

          {status === 'idle' && (
            <label 
              htmlFor="file-upload" 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
            >
              Browse Files
            </label>
          )}

          {status === 'uploading' && (
             <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-blue-500 w-1/2 animate-shimmer rounded-full"></div>
             </div>
          )}
        </div>

        {/* Extraction Result / Preview */}
        <div className="glass-card p-6 h-[500px] overflow-y-auto">
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
               <div className="animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 mb-6">
                     <CheckCircle size={20} />
                     <h3 className="font-medium text-white">Data Extracted Successfully</h3>
                  </div>

                  <div className="space-y-4 text-sm">
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

                     <button 
                       onClick={() => window.location.href = `/documents/${docId}`}
                       className="w-full mt-6 px-6 py-3 bg-white text-black hover:bg-slate-200 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                     >
                        Run AI Compliance Check
                     </button>
                  </div>
               </div>
           )}
        </div>
      </div>
    </div>
  )
}
