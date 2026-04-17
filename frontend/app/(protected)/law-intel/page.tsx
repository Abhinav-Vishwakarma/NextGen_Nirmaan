'use client'

import { useState, useEffect } from 'react'
import { Upload as UploadIcon, File as FileIcon, CheckCircle, Scale } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

export default function LawIntelPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracted' | 'error'>('idle')
  const [whatsNew, setWhatsNew] = useState<string | null>(null)
  const [fetchingNews, setFetchingNews] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    api.get('/api/scraper/whats-new')
      .then(res => {
        if (res.success && res.content) {
          setWhatsNew(res.content)
        }
      })
      .catch(console.error)
      .finally(() => setFetchingNews(false))
  }, [])

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

  const handleSubmit = async () => {
    if (!file) return

    setStatus('uploading')

    showToast({
      type: 'info',
      title: 'Uploading document…',
      message: `Sending ${file.name} to Law Intel engine`,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'LAW') // Use LAW category for law intel

      const uploadRes = await api.postFormData('/api/documents/upload', formData)
      
      setStatus('extracted')

      showToast({
        type: 'success',
        title: 'Document processed!',
        message: 'The legal document has been securely uploaded.',
      })
      
      // Redirect to the document analysis page
      router.push(`/documents/${uploadRes.id}`)
    } catch (err: any) {
      setStatus('error')
      const msg = err.message || 'Upload failed'
      showToast({
        type: 'error',
        title: 'Upload failed',
        message: msg,
        duration: 6000,
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto stagger-children animate-fade-in pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale size={28} className="text-blue-500" />
          <h1 className="text-3xl font-bold text-white">Law Intel</h1>
        </div>
        <p className="text-slate-400">Upload legal notices, contracts, and regulatory documents for AI analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-12 text-center rounded-xl border-2 border-[#ffffff14] transition-all flex flex-col justify-center">
        {!file ? (
          <div 
            className={cn(
              "p-12 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center",
              dragActive ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-white/20"
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
              Select or drop your legal document
            </h3>
            <p className="text-sm text-slate-400 mb-8">Support for PDF, PNG, JPG up to 10MB</p>

            <label 
              htmlFor="file-upload" 
              className="px-8 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-lg font-medium cursor-pointer transition-colors"
            >
              Browse Files
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
              <FileIcon size={40} className="text-blue-400" />
            </div>
            
            <h3 className="text-xl font-medium text-white mb-2">{file.name}</h3>
            <p className="text-slate-400 text-sm mb-10">
              Ready to upload • {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            {status === 'idle' || status === 'error' ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFile(null)}
                  className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                >
                  <UploadIcon size={18} /> Submit Document
                </button>
              </div>
            ) : status === 'uploading' ? (
              <div className="w-full max-w-md mt-4">
                <p className="text-sm text-slate-400 mb-4 animate-pulse">Uploading and extracting legal data...</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2 animate-shimmer rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="text-emerald-400 flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle size={20} />
                <span className="font-medium">Upload successful! Redirecting...</span>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Latest Government Announcements */}
        <div className="glass-card p-8 rounded-xl border border-white/10 h-[500px] overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Scale size={20} className="text-blue-400" />
          Latest Regulatory Announcements
        </h2>
        
        {fetchingNews ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        ) : whatsNew ? (
          <div 
            className="prose prose-invert prose-sm max-w-none text-slate-300 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-2 [&>ul>li>strong]:text-white"
            dangerouslySetInnerHTML={{ __html: whatsNew }} 
          />
        ) : (
          <p className="text-slate-500 italic">No recent announcements found.</p>
        )}
        </div>
      </div>
    </div>
  )
}
