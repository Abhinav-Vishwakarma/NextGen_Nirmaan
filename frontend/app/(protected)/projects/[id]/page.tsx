"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  Shield, 
  CheckCircle2, 
  Building2, 
  User, 
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
  Edit,
  Save,
  Search,
  Plus,
  Activity,
  Cpu,
  Gauge,
  Sparkles,
  ChevronRight,
  Fingerprint,
  History,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import { api, API_BASE } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditStatus, setAuditStatus] = useState<Record<string, 'idle' | 'processing' | 'verifying' | 'done' | 'error'>>({})

  const [isEditingCompliances, setIsEditingCompliances] = useState(false)
  const [tempCompliances, setTempCompliances] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isUpdatingProject, setIsUpdatingProject] = useState(false)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchProjectDetails()
  }, [params.id])

  useEffect(() => {
    if (isEditingCompliances && !searchQuery.trim()) {
      const fetchLaws = async () => {
        setIsSearching(true)
        try {
          const res = await api.get('/api/ai/laws')
          setSearchResults(res.results || [])
        } catch (error) {
          console.error('Failed to fetch laws:', error)
        } finally {
          setIsSearching(false)
        }
      }
      fetchLaws()
    }
  }, [searchQuery, isEditingCompliances])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditingCompliances && searchQuery.trim()) {
        handleSearch()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, isEditingCompliances])

  const fetchProjectDetails = async () => {
    try {
      const data = await api.get(`/api/projects/${params.id}`)
      setProject(data)
      if (data.compliances) {
        setTempCompliances(JSON.parse(data.compliances))
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      showToast({ title: 'System Error', message: 'Failed to synchronize project state.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await api.post('/api/ai/search-laws', { query: searchQuery })
      setSearchResults(res.results || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const runProjectAudit = async () => {
    if (!project.documents || project.documents.length === 0) {
      showToast({ title: 'No Data Source', message: 'Attach documents to begin automated audit.', type: 'warning' })
      return
    }

    setIsAuditing(true)
    showToast({ title: 'Audit Sequence Started', message: `Initializing AI engine for ${project.documents.length} artifacts.`, type: 'info' })

    const docsToProcess = project.documents.filter((d: any) => d.status !== 'VERIFIED' && d.status !== 'FLAGGED')
    
    for (const doc of docsToProcess) {
      setAuditStatus(prev => ({ ...prev, [doc.id]: 'processing' }))
      try {
        if (doc.status === 'UPLOADED' || doc.status === 'EXTRACTING') {
          await api.post(`/api/documents/${doc.id}/ingest`, {})
        }
        setAuditStatus(prev => ({ ...prev, [doc.id]: 'verifying' }))
        await api.post(`/api/documents/${doc.id}/verify`, {})
        setAuditStatus(prev => ({ ...prev, [doc.id]: 'done' }))
      } catch (error) {
        console.error(`Audit failed for ${doc.id}:`, error)
        setAuditStatus(prev => ({ ...prev, [doc.id]: 'error' }))
      }
    }

    setIsAuditing(false)
    fetchProjectDetails()
    showToast({ title: 'Audit Cycle Complete', message: 'Intelligence verification has finished.', type: 'success' })
  }

  const toggleCompliance = (compliance: any) => {
    const isSelected = tempCompliances.some(c => c.payload.section === compliance.payload.section)
    if (isSelected) {
      setTempCompliances(prev => prev.filter(c => c.payload.section !== compliance.payload.section))
    } else {
      setTempCompliances(prev => [...prev, compliance])
    }
  }

  const handleSaveCompliances = async () => {
    setIsUpdatingProject(true)
    try {
      await api.patch(`/api/projects/${params.id}`, { compliances: tempCompliances })
      showToast({ title: 'Framework Updated', type: 'success' })
      setIsEditingCompliances(false)
      fetchProjectDetails()
    } catch (error) {
      console.error('Update failed:', error)
      showToast({ title: 'System Reject', type: 'error' })
    } finally {
      setIsUpdatingProject(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    const formData = new FormData()
    selectedFiles.forEach(file => formData.append('files', file))
    const userId = localStorage.getItem('nextgen_user') || '1'
    const user = { name: 'Aditya Sharma' }
    formData.append('uploadedBy', user.name)

    try {
      await api.postFormData(`/api/projects/${params.id}/upload`, formData)
      showToast({ title: 'Ingestion Success', message: `Registered ${selectedFiles.length} artifacts.`, type: 'success' })
      setSelectedFiles([])
      fetchProjectDetails()
    } catch (error) {
      console.error('Upload failed:', error)
      showToast({ title: 'Ingestion Failure', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-pulse">
        <div className="mesh-bg" />
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.2)]" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Intelligence...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-32 space-y-6">
        <AlertCircle size={64} className="mx-auto text-rose-500 opacity-50" />
        <h2 className="text-3xl font-black text-white tracking-tighter">System Reference Lost</h2>
        <p className="text-slate-500 max-w-sm mx-auto">The requested infrastructure project record could not be located in our secure database.</p>
        <Button onClick={() => router.push('/projects')} variant="secondary" leftIcon={<ArrowLeft size={18}/>}>Return to Hub</Button>
      </div>
    )
  }

  const formatTimeline = () => {
    if (!project.timelineType) return 'Unscheduled'
    const start = project.startDate ? new Date(project.startDate) : null
    const end = project.endDate ? new Date(project.endDate) : null
    if (project.timelineType === 'MONTH') return start ? start.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'
    if (project.timelineType === 'DATE') return start ? start.toLocaleDateString('default', { dateStyle: 'long' }) : 'N/A'
    return (start && end) ? `${start.toLocaleDateString()} — ${end.toLocaleDateString()}` : start ? `${start.toLocaleDateString()} (${project.duration})` : 'N/A'
  }

  const currentCompliances = isEditingCompliances ? tempCompliances : (project.compliances ? JSON.parse(project.compliances) : [])

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fadeInUp pb-24">
      <div className="mesh-bg" />
      
      {/* Dynamic Navigation */}
      <nav className="flex items-center justify-between">
        <Link href="/projects" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Project Archive
        </Link>
        <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={12} className="text-indigo-500" />
                Auto-Save Enabled
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                {project.createdBy.substring(0,2).toUpperCase()}
            </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="glass-panel p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -mr-32 -mt-32 rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none">{project.name}</h1>
                <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                    project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' :
                    project.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5'
                }`}>
                    {project.status}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-indigo-500 border border-slate-800">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Client Organization</p>
                        <p className="text-sm font-bold text-slate-100">{project.client || 'General Entity'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-emerald-500 border border-slate-800">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Audit Cycle</p>
                        <p className="text-sm font-bold text-slate-100">{formatTimeline()}</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-4">
            <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Project Integrity</p>
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
                    <Fingerprint size={16} className="text-indigo-400" />
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{project.id.split('-')[0]}</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Logic & Status */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Regulatory Intelligence Block */}
          <section className="glass-panel p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Intelligence Matrix</h2>
                    <p className="text-xs font-medium text-slate-500">Regulatory frameworks assigned to this project.</p>
                </div>
              </div>
              
              {!isEditingCompliances ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditingCompliances(true)} leftIcon={<Edit size={14} />}>
                  Modify Framework
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingCompliances(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveCompliances} isLoading={isUpdatingProject} leftIcon={<Save size={14}/>}>Submit</Button>
                </div>
              )}
            </div>

            {isEditingCompliances && (
              <div className="space-y-4 animate-fadeInUp">
                <Input 
                    placeholder="Search master legal database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14"
                />
                
                {searchQuery.trim() && (
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-10 opacity-50"><Activity size={24} className="animate-spin text-indigo-500" /></div>
                    ) : searchResults.length > 0 ? (
                      searchResults.filter(res => !tempCompliances.some(tc => tc.payload.section === res.payload.section)).map((result, idx) => (
                        <div key={idx} onClick={() => toggleCompliance(result)} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-900 rounded-2xl hover:border-indigo-500/50 cursor-pointer transition-all group">
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 block">{result.payload.section}</span>
                            <p className="text-sm text-slate-300 font-bold line-clamp-1">{result.payload.title}</p>
                          </div>
                          <Plus size={20} className="text-slate-700 group-hover:text-indigo-500" />
                        </div>
                      ))
                    ) : null}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCompliances.length > 0 ? (
                currentCompliances.map((c: any, i: number) => (
                  <div key={i} className="group relative p-6 bg-slate-950 border border-slate-900 rounded-3xl transition-all hover:bg-indigo-500/5 hover:border-indigo-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">{c.payload.section}</div>
                      {isEditingCompliances && (
                        <button onClick={() => toggleCompliance(c)} className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all"><X size={14}/></button>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-3">{c.payload.title}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-slate-900">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">No Framework Configured</p>
                </div>
              )}
            </div>
          </section>

          {/* Artifact Processing Base */}
          <section className="glass-panel p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Audit Archive</h2>
                    <p className="text-xs font-medium text-slate-500">Document registry and AI analysis status.</p>
                </div>
              </div>
              
              {project.documents?.length > 0 && (
                <Button 
                  onClick={runProjectAudit}
                  isLoading={isAuditing}
                  className="px-8 shadow-xl shadow-indigo-500/10"
                  leftIcon={!isAuditing && <Sparkles size={16} />}
                >
                  {isAuditing ? 'Auditing...' : 'Initiate Audit'}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {project.documents && project.documents.length > 0 ? (
                project.documents.map((doc: any) => {
                  const status = auditStatus[doc.id] || 'idle'
                  const isProcessing = status === 'processing' || status === 'verifying'
                  
                  return (
                    <div key={doc.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-950 border border-slate-900 rounded-[2rem] hover:bg-slate-900/40 hover:border-indigo-500/20 transition-all gap-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 ${isProcessing ? 'animate-pulse' : ''}`}>
                          {isProcessing ? <Cpu size={24} className="animate-spin" /> : <FileText size={24} className="text-indigo-400 group-hover:text-white" />}
                        </div>
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-black text-white leading-tight line-clamp-1">{doc.fileName}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5"><Clock size={12}/> {new Date(doc.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">ID: {doc.id.split('-')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-auto md:ml-0">
                        {doc.complianceScore !== null && (
                          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
                            <Gauge size={16} className={doc.complianceScore >= 90 ? 'text-emerald-500' : doc.complianceScore >= 70 ? 'text-amber-500' : 'text-rose-500'} />
                            <span className="text-xs font-black text-white tracking-widest">{doc.complianceScore}%</span>
                          </div>
                        )}

                        <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] ${
                          doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          doc.status === 'FLAGGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          isProcessing ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                          {isProcessing ? (status === 'processing' ? 'EXTRACTING' : 'VALIDATING') : doc.status}
                        </div>

                        <div className="flex items-center gap-2">
                            {doc.complianceScore !== null && (
                                <Link 
                                    href={`/documents/${doc.id}`}
                                    className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                >
                                    <ChevronRight size={18} />
                                </Link>
                            )}
                            <a 
                                href={`${API_BASE}/api/files/${doc.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-slate-900 text-slate-600 hover:text-white rounded-xl transition-all"
                            >
                                <ExternalLink size={18} />
                            </a>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-24 glass-panel border-dashed border-slate-800 p-12">
                  <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Artifacts Registered</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">Use the ingestion portal to upload compliance documentation for automated AI processing.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Ingestion Portal */}
        <div className="lg:col-span-4 space-y-10">
          <section className="glass-panel p-8 sticky top-12 overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Upload size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none">Ingestion</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Data Entry Point</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="relative group/zone cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border border-dashed border-slate-800 group-hover/zone:border-indigo-500/50 group-hover/zone:bg-indigo-500/5 transition-all duration-500 rounded-[2.5rem] p-12 text-center bg-slate-950 shadow-inner">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700 group-hover/zone:text-indigo-500 group-hover/zone:scale-110 transition-all duration-500 shadow-2xl mb-6">
                    <CloudUpload size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-tight">Drop Manifests Here</p>
                    <p className="text-[10px] text-slate-600 mt-2 font-black uppercase tracking-widest">PDF • PNG • JPG • WEBP</p>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-6 animate-fadeInUp">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ready for Ingestion</p>
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest">{selectedFiles.length} Artifacts</span>
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl group/file">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-indigo-500 border border-slate-800">
                            <FileText size={18} />
                          </div>
                          <span className="text-xs text-slate-300 truncate font-bold">{file.name}</span>
                        </div>
                        <button onClick={() => removeSelectedFile(idx)} className="p-2 hover:bg-rose-500/10 text-slate-700 hover:text-rose-500 rounded-lg transition-all">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleUploadSubmit}
                    isLoading={isUploading}
                    className="w-full h-16 text-xs uppercase tracking-[0.2em] font-black"
                  >
                    Commit Ingestion
                  </Button>
                </div>
              )}
              
              <div className="flex justify-center gap-10 pt-4 border-t border-slate-800/50">
                <div className="text-center">
                    <p className="text-lg font-black text-white">AES-256</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Encryption</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-white">GPT-O4</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Vision Engine</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function CloudUpload(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  )
}
