"use client"

import { useState, useEffect, use } from 'react'
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
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchProjectDetails()
  }, [params.id])

  const fetchProjectDetails = async () => {
    try {
      const data = await api.get(`/api/projects/${params.id}`)
      setProject(data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
      addToast('Failed to load project details', 'error')
    } finally {
      setIsLoading(false)
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
      addToast(`Successfully uploaded ${selectedFiles.length} documents`, 'success')
      setSelectedFiles([])
      fetchProjectDetails() // Refresh list
    } catch (error) {
      console.error('Upload failed:', error)
      addToast('Failed to upload documents', 'error')
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

  const compliances = project.compliances ? JSON.parse(project.compliances) : []

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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Regulatory Frameworks</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compliances.length > 0 ? (
                compliances.map((c: any, i: number) => (
                  <div key={i} className="group p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{c.payload.section}</span>
                      <CheckCircle2 size={14} className="text-green-500" />
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
