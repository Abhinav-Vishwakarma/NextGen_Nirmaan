"use client"

import { useState, useEffect } from 'react'
import { Plus, Folder, Search, CheckCircle, X, ArrowRight, ArrowLeft, Briefcase, Building2, Shield, Globe, Info } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export default function ProjectsPage() {
  const { showToast } = useToast()
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Project details
  const [newProjectName, setNewProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  
  // Compliance search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCompliances, setSelectedCompliances] = useState<any[]>([])

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/projects')
      setProjects(res.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all laws when query is empty
  useEffect(() => {
    if (step === 2 && !searchQuery.trim()) {
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
  }, [searchQuery, step])

  // Live Search with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

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
    const isSelected = selectedCompliances.some(c => c.payload.section === compliance.payload.section)
    if (isSelected) {
      setSelectedCompliances(prev => prev.filter(c => c.payload.section !== compliance.payload.section))
    } else {
      setSelectedCompliances(prev => [...prev, compliance])
    }
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setStep(1)
    setNewProjectName('')
    setClientName('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedCompliances([])
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    // Get current user from localStorage
    const userId = localStorage.getItem('nextgen_user') || '1'
    const USERS = [
      { id: '1', name: 'Aditya Sharma' },
      { id: '2', name: 'Vikram Mehta' },
      { id: '3', name: 'Sara Khan' },
    ]
    const user = USERS.find(u => u.id === userId) || USERS[0]

    try {
      await api.post('/api/projects', {
        name: newProjectName,
        client: clientName,
        compliances: selectedCompliances,
        createdBy: user.name
      })
      
      // Refresh list
      await fetchProjects()
      showToast({ title: 'Project Created', message: `${newProjectName} has been initialized successfully.`, type: 'success' })
      resetModal()
    } catch (error) {
      console.error('Failed to create project:', error)
      showToast({ title: 'Creation Failed', message: 'Unable to initialize project.', type: 'error' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm uppercase tracking-wider mb-2">
            <Globe size={16} />
            Compliance Management System
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Projects <span className="text-slate-500 font-normal">/ Overview</span>
          </h1>
          <p className="text-slate-400 mt-2 max-w-lg">
            Monitor and orchestrate your infrastructure projects with AI-powered compliance monitoring.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <div 
              key={project.id} 
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <Info size={16} />
                </div>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Folder className="text-blue-500" size={24} />
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${
                  project.status === 'ACTIVE' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                  project.status === 'COMPLETED' ? 'bg-slate-800/50 text-slate-400 border-slate-700' :
                  'bg-yellow-500/5 text-yellow-400 border-yellow-500/20'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{project.name}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                <Building2 size={14} />
                {project.client || 'General Client'}
              </div>
              
              <div className="pt-5 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Updated {new Date(project.lastUpdated).toLocaleDateString()}
                </span>
                <Link href={`/projects/${project.id}`} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors font-bold group/link">
                  View Project
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl">
            <Folder size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 font-medium">No projects found. Create your first project to get started!</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={resetModal} 
        title={step === 1 ? "Project Identity" : "Compliance Intelligence"}
      >
        <div className="relative">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8 px-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-800'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-800'}`} />
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="relative group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Project Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <Briefcase size={18} />
                    </div>
                    <Input 
                      className="pl-12 bg-slate-950 border-slate-800 h-14 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Metro Line Extension - Phase 2"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Client Organization</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <Building2 size={18} />
                    </div>
                    <Input 
                      className="pl-12 bg-slate-950 border-slate-800 h-14 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Ministry of Urban Development"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-0.5">
                  <Info size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-400">Pro Tip</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Clear project names and client details help our AI better categorize relevant legal frameworks in the next step.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  Search & Map Compliances
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <Search size={18} />
                    </div>
                    <Input 
                      className="pl-12 bg-slate-950 border-slate-800 h-14 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Environmental impact laws for bridges..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch()
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching} 
                    className="h-14 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shrink-0"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>

                {/* Selected Count */}
                {selectedCompliances.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Selected Frameworks
                    </span>
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-bold">
                      {selectedCompliances.length} Items
                    </span>
                  </div>
                )}

                {/* Selected Compliances Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedCompliances.map((c, i) => (
                    <div key={i} className="group flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider pl-3 pr-2 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">
                      {c.payload.section}
                      <button 
                        onClick={() => toggleCompliance(c)}
                        className="p-0.5 hover:bg-blue-500/30 rounded-md transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Results List */}
                <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                      <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-sm font-medium animate-pulse">Scanning regulatory database...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {!searchQuery.trim() && (
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-1 mb-2">Available Frameworks</div>
                      )}
                      {searchResults.map((result, idx) => {
                        const isSelected = selectedCompliances.some(c => c.payload.section === result.payload.section);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleCompliance(result)}
                            className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                                  <Shield size={14} />
                                </div>
                                <span className={`text-sm font-bold ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                                  {result.payload.section}
                                </span>
                              </div>
                              {searchQuery.trim() && (
                                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                  result.score > 0.8 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                }`}>
                                  {Math.round(result.score * 100)}% Match
                                </div>
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                              {result.payload.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                      <Search size={32} className="mx-auto text-slate-700 mb-3" />
                      <p className="text-sm text-slate-500">No regulatory frameworks found for this query.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-slate-600">No available frameworks found in the database.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-8 mt-4 border-t border-slate-800/50">
            <button 
              onClick={step === 1 ? resetModal : () => setStep(1)}
              className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              {step === 1 ? 'Cancel' : <><ArrowLeft size={16} /> Back</>}
            </button>
            
            <button 
              onClick={step === 1 ? () => setStep(2) : handleCreateProject}
              disabled={step === 1 && !newProjectName.trim()}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                step === 1 && !newProjectName.trim() 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
              }`}
            >
              {step === 1 ? <>Next Step <ArrowRight size={16} /></> : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>

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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from { transform: translateX(1rem); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .animate-in {
          animation-duration: 400ms;
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fadeIn;
        }

        .slide-in-from-right-4 {
          animation-name: slideInRight;
        }

        .duration-300 {
          animation-duration: 300ms;
        }

        .duration-500 {
          animation-duration: 500ms;
        }
      `}</style>
    </div>
  )
}
