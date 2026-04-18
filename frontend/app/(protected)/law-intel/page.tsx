'use client'

import { useState, useEffect } from 'react'
import { Upload as UploadIcon, File as FileIcon, CheckCircle, Scale, ArrowLeft, ChevronRight, LayoutDashboard, History, Database, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

export default function LawIntelPage() {
  const [activeMode, setActiveMode] = useState<'audit' | 'manager'>('audit')
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracted' | 'error'>('idle')
  const [department, setDepartment] = useState('General')
  const [category, setCategory] = useState('GST')
  const [laws, setLaws] = useState<any[]>([])
  const [selectedLawHistory, setSelectedLawHistory] = useState<any[] | null>(null)
  const [loadingLaws, setLoadingLaws] = useState(false)
  
  const [whatsNew, setWhatsNew] = useState<string | null>(null)
  const [fetchingNews, setFetchingNews] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchCurrentLaws()
    // ... rest of effect
  }, [])

  const fetchCurrentLaws = async () => {
      setLoadingLaws(true)
      try {
          const res = await api.get('/api/ai/laws')
          // Assuming AI server returns { results: [{ payload: ... }] }
          const formatted = (res.results || []).map((r: any) => r.payload).filter((p: any) => p.is_latest)
          setLaws(formatted)
      } catch (err) {
          console.error(err)
      } finally {
          setLoadingLaws(false)
      }
  }

  const fetchLawHistory = async (title: string, section: string) => {
      try {
          const res = await api.get(`/api/ai/laws/history?title=${encodeURIComponent(title)}&section=${encodeURIComponent(section)}`)
          setSelectedLawHistory(res.history || [])
      } catch (err) {
          showToast({ type: 'error', title: 'Failed to fetch history' })
      }
  }

  const handleRestore = async (id: string) => {
      try {
          await api.post(`/api/ai/laws/restore/${id}`, {})
          showToast({ type: 'success', title: 'Version Restored', message: 'The regulatory logic has been updated.' })
          setSelectedLawHistory(null)
          fetchCurrentLaws()
      } catch (err) {
          showToast({ type: 'error', title: 'Restore Failed' })
      }
  }

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
      formData.append('category', activeMode === 'manager' ? category : 'LAW')

      if (activeMode === 'manager') {
          // Manual Ingestion flow
          const uploadRes = await api.postFormData('/api/documents/upload', formData)
          const ingestRes = await api.post(`/api/ai/laws/ingest/${uploadRes.id}`, { department, category })
          
          setStatus('idle')
          setFile(null)
          showToast({
            type: 'success',
            title: 'Knowledge Base Updated',
            message: `Successfully ingested ${ingestRes.count} regulatory clauses into ${department}.`,
          })
          fetchCurrentLaws()
      } else {
          // Audit flow
          const uploadRes = await api.postFormData('/api/documents/upload', formData)
          setStatus('extracted')
          showToast({
            type: 'success',
            title: 'Document processed!',
            message: 'The legal document has been securely uploaded.',
          })
          router.push(`/documents/${uploadRes.id}`)
      }
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
    <div className="max-w-7xl mx-auto stagger-children animate-fade-in pb-16">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <Scale size={32} className="text-blue-500" />
             <h1 className="text-4xl font-black tracking-tight text-white">Law Intel</h1>
           </div>
           <p className="text-sm text-slate-400 font-medium">Neural engine for legal intelligence and regulatory compliance.</p>
        </div>

        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveMode('audit')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeMode === 'audit' ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <ShieldCheck size={14} /> Audit Engine
            </button>
            <button 
              onClick={() => setActiveMode('manager')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeMode === 'manager' ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Database size={14} /> Compliance Manager
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Interaction Area */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-card p-10 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <LayoutDashboard size={120} />
            </div>

            <div className="relative space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            {activeMode === 'audit' ? 'Compliance Audit' : 'Update Knowledge Base'}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {activeMode === 'audit' ? 'Analyze document against regulations' : 'Ingest new regulatory documents'}
                        </p>
                    </div>
                </div>

                {activeMode === 'manager' && !file && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                            <input 
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              placeholder="e.g. Finance"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                            <select 
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                            >
                                <option value="GST">GST</option>
                                <option value="LABOR">LABOR</option>
                                <option value="MCA">MCA</option>
                                <option value="INCOME_TAX">INCOME TAX</option>
                            </select>
                        </div>
                    </div>
                )}
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
          </div>

          {activeMode === 'manager' && (
              <div className="glass-card p-8 rounded-3xl border border-white/10 bg-blue-500/[0.02]">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <History size={14} className="text-blue-500" /> Compliance History
                      </h2>
                      <div className="px-3 py-1 bg-slate-950 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          {laws.length} Core Provisions
                      </div>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {loadingLaws ? (
                          <div className="py-10 text-center text-slate-600 animate-pulse">Synchronizing neural library...</div>
                      ) : laws.map((law, i) => (
                          <div 
                            key={i} 
                            onClick={() => fetchLawHistory(law.title, law.section)}
                            className="p-4 bg-slate-950 border border-white/5 rounded-2xl hover:border-blue-500/50 cursor-pointer transition-all group"
                          >
                              <div className="flex items-center justify-between">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors">{law.title}</span>
                                      <span className="text-[10px] font-bold text-slate-500">{law.section}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-black text-slate-400 px-2 py-0.5 bg-white/5 rounded-md">v{law.version}</span>
                                      <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-5 space-y-8">
            {selectedLawHistory ? (
                <div className="glass-card p-8 rounded-3xl border border-blue-500/20 bg-blue-500/[0.03] animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => setSelectedLawHistory(null)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-2">
                            <ArrowLeft size={14} /> Back to Library
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight mb-1">{selectedLawHistory[0]?.title}</h3>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedLawHistory[0]?.section}</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Version Timeline</h4>
                            {selectedLawHistory.map((ver, i) => (
                                <div key={i} className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    ver.isLatest ? "bg-blue-600/10 border-blue-500/30" : "bg-slate-950 border-white/5 opacity-60 hover:opacity-100"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-white tracking-widest">VERSION {ver.version}</span>
                                            {ver.isLatest && <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded">ACTIVE</span>}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500">{new Date(ver.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 line-clamp-2 mb-4 italic leading-relaxed">"{ver.summary}"</p>
                                    
                                    {!ver.isLatest && (
                                        <button 
                                          onClick={() => handleRestore(ver.id)}
                                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white rounded-lg border border-white/10 transition-all"
                                        >
                                            Restore this Version
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-8 rounded-3xl border border-white/10 h-fit">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 tracking-tight">
                        <Scale size={20} className="text-blue-400" />
                        Regulatory Radar
                    </h2>
                    
                    {fetchingNews ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 bg-white/5 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-3 bg-white/5 rounded-full w-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : whatsNew ? (
                        <div 
                            className="prose prose-invert prose-sm max-w-none text-slate-400 [&>ul]:list-none [&>ul]:p-0 [&>ul>li]:mb-6 [&>ul>li]:p-4 [&>ul>li]:bg-slate-950 [&>ul>li]:border [&>ul>li]:border-white/5 [&>ul>li]:rounded-2xl [&>ul>li>a]:text-blue-400 [&>ul>li>a]:font-black [&>ul>li>a]:no-underline [&>ul>li>a]:uppercase [&>ul>li>a]:text-[10px] [&>ul>li>a]:tracking-[0.15em]"
                            dangerouslySetInnerHTML={{ __html: whatsNew }} 
                        />
                    ) : (
                        <p className="text-slate-500 italic text-sm">No recent announcements found.</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
