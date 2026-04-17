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
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Edit Compliance states
  const [isEditingCompliances, setIsEditingCompliances] = useState(false)
  const [tempCompliances, setTempCompliances] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isUpdatingProject, setIsUpdatingProject] = useState(false)

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchProjectDetails()
  }, [params.id])

  // Fetch all laws when editing and query is empty
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

  // Live Search with Debounce for Edit Mode
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
      showToast({ title: 'Failed to load project details', type: 'error' })
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
      await api.patch(`/api/projects/${params.id}`, {
        compliances: tempCompliances
      })
      showToast({ title: 'Project compliances updated successfully', type: 'success' })
      setIsEditingCompliances(false)
      fetchProjectDetails()
    } catch (error) {
      console.error('Failed to update compliances:', error)
      showToast({ title: 'Failed to update project', type: 'error' })
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
    selectedFiles.forEach(file => {
      formData.append('files', file)
    })
    
    // Get current user for attribution
    const userId = localStorage.getItem('nextgen_user') || '1'
    const USERS = [
      { id: '1', name: 'Aditya Sharma' },
      { id: '2', name: 'Vikram Mehta' },
      { id: '3', name: 'Sara Khan' },
    ]
    const user = USERS.find(u => u.id === userId) || USERS[0]
    formData.append('uploadedBy', user.name)

    try {
      await api.postFormData(`/api/projects/${params.id}/upload`, formData)
      showToast({ title: `Successfully uploaded ${selectedFiles.length} documents`, type: 'success' })
      setSelectedFiles([])
      fetchProjectDetails() // Refresh list
    } catch (error) {
      console.error('Upload failed:', error)
      showToast({ title: 'Failed to upload documents', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Loading project architecture...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white">Project Not Found</h2>
        <p className="text-slate-400 mt-2">The project you are looking for does not exist or has been moved.</p>
        <Link href="/projects" className="inline-block mt-6 text-blue-400 hover:underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const currentCompliances = isEditingCompliances ? tempCompliances : (project.compliances ? JSON.parse(project.compliances) : [])

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </Link>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">{project.name}</h1>
              <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${
                project.status === 'ACTIVE' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                project.status === 'COMPLETED' ? 'bg-slate-800/50 text-slate-400 border-slate-700' :
                'bg-yellow-500/5 text-yellow-400 border-yellow-500/20'
              }`}>
                {project.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-blue-500" />
                {project.client}
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-purple-500" />
                Created by {project.createdBy}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-500" />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Compliances */}
        <div className="lg:col-span-2 space-y-8">
          {/* Compliance Frameworks */}
          <section className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Regulatory Frameworks</h2>
              </div>
              
              {!isEditingCompliances ? (
                <button 
                  onClick={() => setIsEditingCompliances(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 hover:border-blue-500/30"
                >
                  <Edit size={14} />
                  Edit Frameworks
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsEditingCompliances(false)
                      setTempCompliances(project.compliances ? JSON.parse(project.compliances) : [])
                    }}
                    className="px-4 py-2 text-slate-500 hover:text-white text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCompliances}
                    disabled={isUpdatingProject}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    {isUpdatingProject ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {isEditingCompliances && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Search size={18} />
                  </div>
                  <Input 
                    className="pl-12 bg-slate-950 border-slate-800 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search for new regulations to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {searchQuery.trim() && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {isSearching ? (
                      <div className="text-center py-6 text-slate-500 text-xs animate-pulse">Scanning regulations...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.filter(res => !tempCompliances.some(tc => tc.payload.section === res.payload.section)).map((result, idx) => (
                        <div 
                          key={idx}
                          onClick={() => toggleCompliance(result)}
                          className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all group"
                        >
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-blue-400 uppercase">{result.payload.section}</span>
                            <p className="text-xs text-slate-300 line-clamp-1">{result.payload.title}</p>
                          </div>
                          <Plus size={16} className="text-slate-600 group-hover:text-blue-500" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-600 text-xs italic">No results found for "{searchQuery}"</div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCompliances.length > 0 ? (
                currentCompliances.map((c: any, i: number) => (
                  <div key={i} className={`group relative p-4 bg-slate-950 border rounded-2xl transition-all ${isEditingCompliances ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-slate-800 hover:border-blue-500/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{c.payload.section}</span>
                      {!isEditingCompliances ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <button 
                          onClick={() => toggleCompliance(c)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {c.payload.title}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic col-span-full">No specific compliance frameworks mapped to this project yet.</p>
              )}
            </div>
          </section>

          {/* Uploaded Documents List */}
          <section className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                  <FileText size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Project Documents</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold">
                {project.documents?.length || 0} Total
              </span>
            </div>

            <div className="space-y-3">
              {project.documents && project.documents.length > 0 ? (
                project.documents.map((doc: any) => (
                  <div key={doc.id} className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-900 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-900 rounded-xl text-slate-400 group-hover:text-blue-400 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{doc.fileName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <User size={10} /> {doc.uploadedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        doc.status === 'VERIFIED' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                        doc.status === 'FLAGGED' ? 'bg-red-500/5 text-red-400 border-red-500/20' :
                        'bg-blue-500/5 text-blue-400 border-blue-500/20'
                      }`}>
                        {doc.status}
                      </span>
                      <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                  <FileText size={32} className="mx-auto text-slate-800 mb-3" />
                  <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Upload Tool */}
        <div className="space-y-6">
          <section className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Upload size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Upload Document</h2>
            </div>

            <div className="space-y-6">
              {/* Dropzone Area */}
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-800 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500 group-hover:text-blue-500 transition-colors">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">Drop files here</p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse</p>
                  </div>
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Selected for ingestion</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl group animate-in slide-in-from-right-2 duration-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={16} className="text-blue-500 shrink-0" />
                          <span className="text-xs text-slate-300 truncate font-medium">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeSelectedFile(idx)}
                          className="p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleUploadSubmit}
                    disabled={isUploading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Start Ingestion
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-500">
                    By submitting, you agree to our AI processing of these documents for compliance validation.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
