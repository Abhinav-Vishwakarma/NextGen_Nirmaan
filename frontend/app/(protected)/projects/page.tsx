"use client"

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Folder, 
  Search, 
  Calendar, 
  Clock, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Briefcase, 
  Building2, 
  Shield, 
  Globe, 
  Info,
  Layers,
  Sparkles,
  SearchCode
} from 'lucide-react'
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

  // Timeline states
  const [timelineType, setTimelineType] = useState('MONTH') // MONTH | DATE | RELATIVE | RANGE
  const [timelineStart, setTimelineStart] = useState('')
  const [timelineEnd, setTimelineEnd] = useState('')
  const [timelineDuration, setTimelineDuration] = useState('1 month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    if (timelineType === 'MONTH') {
      const monthStr = (selectedMonth + 1).toString().padStart(2, '0')
      setTimelineStart(`${selectedYear}-${monthStr}`)
    }
  }, [selectedMonth, selectedYear, timelineType])

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

  useEffect(() => {
    if (step === 3 && !searchQuery.trim()) {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 3 && searchQuery.trim()) {
        handleSearch()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, step])

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
    setTimelineType('MONTH')
    setTimelineStart('')
    setTimelineEnd('')
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    const userId = localStorage.getItem('nextgen_user') || '1'
    const USERS = [{ id: '1', name: 'Aditya Sharma' }, { id: '2', name: 'Vikram Mehta' }, { id: '3', name: 'Sara Khan' }]
    const user = USERS.find(u => u.id === userId) || USERS[0]

    try {
      await api.post('/api/projects', {
        name: newProjectName,
        client: clientName,
        compliances: selectedCompliances,
        createdBy: user.name,
        timelineType,
        startDate: timelineStart,
        endDate: timelineEnd,
        duration: timelineDuration
      })
      await fetchProjects()
      showToast({ title: 'Project Created', message: `${newProjectName} initialized successfully.`, type: 'success' })
      resetModal()
    } catch (error) {
      console.error('Failed to create project:', error)
      showToast({ title: 'Creation Failed', type: 'error' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeInUp pb-20">
      <div className="mesh-bg" />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <Layers size={12} />
            Command Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Project <span className="text-indigo-500">Portfolio</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-base font-medium leading-relaxed">
            Manage your high-stakes infrastructure projects with automated AI compliance monitoring and risk assessment.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="shadow-2xl shadow-indigo-500/20"
          leftIcon={<Plus size={20} />}
        >
          Initialize Project
        </Button>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[280px] glass-panel border-dashed border-slate-800/50 flex flex-col p-8 opacity-50">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 shimmer mb-6" />
                <div className="w-3/4 h-6 bg-slate-800/50 shimmer mb-4" />
                <div className="w-1/2 h-4 bg-slate-800/50 shimmer mb-auto" />
                <div className="w-full h-10 bg-slate-800/50 shimmer rounded-xl" />
            </div>
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <div 
              key={project.id} 
              className="glass-panel p-8 flex flex-col group relative overflow-hidden"
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-8">
                <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Folder size={28} />
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  project.status === 'COMPLETED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {project.status}
                </div>
              </div>
              
              <div className="space-y-2 mb-8 flex-1">
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1">{project.name}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Building2 size={16} className="shrink-0" />
                  <span className="truncate">{project.client || 'General Client'}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Last Update</span>
                    <span className="text-xs font-bold text-slate-400">{new Date(project.lastUpdated).toLocaleDateString()}</span>
                </div>
                <Link 
                    href={`/projects/${project.id}`} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group/btn"
                >
                  Inspect
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center glass-panel border-dashed p-12">
            <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                <Folder size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Initialize your first project</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Start monitoring your infrastructure compliance by creating a digital twin of your regulatory requirements.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary" leftIcon={<Plus size={18} />}>Create Project</Button>
          </div>
        )}
      </div>

      {/* Initialize Project Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetModal} 
        title={step === 1 ? "Project Identity" : step === 2 ? "Project Timeline" : "Compliance Intelligence"}
      >
        <div className="space-y-8">
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 px-1">
            {[1, 2, 3].map((s) => (
                <div 
                    key={s} 
                    className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} 
                />
            ))}
          </div>

          <div className="min-h-[300px]">
            {step === 1 ? (
                <div className="space-y-6 animate-fadeInUp">
                    <Input 
                        label="Project Name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. South Metro Tunnel Development"
                        className="h-14 text-base"
                    />
                    <Input 
                        label="Client Organization"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Infrastructure Victoria"
                        className="h-14 text-base"
                    />
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0 h-fit">
                            <Info size={16} />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Project names should be unique for clarity. This identity will be used across all generated legal audit reports.
                        </p>
                    </div>
                </div>
            ) : step === 2 ? (
                <div className="space-y-8 animate-fadeInUp">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'MONTH', label: 'Month Select', icon: <Calendar size={18} /> },
                            { id: 'RANGE', label: 'Custom Range', icon: <Calendar size={18} /> },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimelineType(t.id)}
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-4 group ${
                                    timelineType === t.id 
                                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-xl shadow-indigo-500/5' 
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                            >
                                <div className={`p-3 rounded-xl transition-colors ${timelineType === t.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                                    {t.icon}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest leading-none">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                        {timelineType === 'MONTH' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <button onClick={() => setSelectedYear(prev => prev - 1)} className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><ArrowLeft size={16}/></button>
                                    <span className="text-2xl font-black text-white px-8">{selectedYear}</span>
                                    <button onClick={() => setSelectedYear(prev => prev + 1)} className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><ArrowRight size={16}/></button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {MONTHS.map((month, idx) => (
                                        <button
                                            key={month}
                                            onClick={() => setSelectedMonth(idx)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                selectedMonth === idx ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-slate-950 text-slate-600 hover:bg-slate-800'
                                            }`}
                                        >
                                            {month.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6">
                                <Input type="date" label="Start Date" value={timelineStart} onChange={(e) => setTimelineStart(e.target.value)} />
                                <Input type="date" label="End Date" value={timelineEnd} onChange={(e) => setTimelineEnd(e.target.value)} />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fadeInUp">
                    <div className="flex gap-2">
                        <Input 
                            className="h-14 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find specific regulatory frameworks..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} isLoading={isSearching} size="lg" className="shrink-0 px-8">Find</Button>
                    </div>

                    <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Consulting AI Knowledge Base...</p>
                            </div>
                        ) : searchResults.map((result, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => toggleCompliance(result)}
                                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group ${
                                    selectedCompliances.some(c => c.payload.section === result.payload.section) 
                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/5' 
                                        : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedCompliances.some(c => c.payload.section === result.payload.section) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            <Shield size={16} />
                                        </div>
                                        <span className="text-sm font-black text-white tracking-tight">{result.payload.section}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{Math.round(result.score * 100)}% Match</div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">{result.payload.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-800/50">
            <button 
              onClick={step === 1 ? resetModal : () => setStep(step - 1)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2"
            >
              {step === 1 ? 'Discard' : <><ArrowLeft size={16} /> Previous</>}
            </button>
            <div className="flex gap-4">
                {selectedCompliances.length > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-500/10 px-4 rounded-xl border border-indigo-500/20">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{selectedCompliances.length} mapped</span>
                    </div>
                )}
                <Button 
                    onClick={step < 3 ? () => setStep(step + 1) : handleCreateProject}
                    disabled={step === 1 && !newProjectName.trim()}
                    size="lg"
                    className="px-10"
                >
                    {step < 3 ? 'Next Phase' : 'Activate Intelligence'}
                </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
