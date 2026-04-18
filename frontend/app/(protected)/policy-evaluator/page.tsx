"use client"

import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  History, 
  Search,
  ChevronRight,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export default function PolicyEvaluatorPage() {
  const { showToast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableLaws, setAvailableLaws] = useState<any[]>([])
  const [selectedLaws, setSelectedLaws] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchHistory()
    fetchLaws()
  }, [])

  const fetchHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await api.get('/api/policy-evaluations')
      setEvaluations(res.evaluations || [])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const fetchLaws = async () => {
    try {
      const res = await api.get('/api/ai/laws')
      setAvailableLaws(res.results || [])
    } catch (error) {
      console.error('Failed to fetch laws:', error)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const toggleLaw = (law: any) => {
    const isSelected = selectedLaws.some(l => l.payload?.section === law.payload?.section)
    if (isSelected) {
      setSelectedLaws(prev => prev.filter(l => l.payload?.section !== law.payload?.section))
    } else {
      setSelectedLaws(prev => [...prev, law])
    }
  }

  const handleEvaluate = async () => {
    if (!file || selectedLaws.length === 0) {
      showToast({ title: 'Missing Information', message: 'Please upload a policy and select at least one compliance.', type: 'error' })
      return
    }

    setIsUploading(true)
    showToast({ title: 'Evaluation Started', message: 'AI is analyzing your policy against selected compliances...', type: 'info' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('selectedLaws', JSON.stringify(selectedLaws))
      
      const user = JSON.parse(localStorage.getItem('nextgen_user_data') || '{"name": "Admin"}')
      formData.append('uploadedBy', user.name)

      const result = await api.postFormData('/api/policy-evaluations/evaluate', formData)
      
      setEvaluations(prev => [result, ...prev])
      setSelectedResult(result)
      showToast({ title: 'Analysis Complete', message: `Policy scored ${result.complianceScore}% compliance.`, type: 'success' })
      
      // Reset form
      setFile(null)
      setSelectedLaws([])
    } catch (error) {
      console.error('Evaluation failed:', error)
      showToast({ title: 'Analysis Failed', message: 'There was an error processing your request.', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const filteredLaws = availableLaws.filter(law => 
    law.payload?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    law.payload?.section?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return <CheckCircle className="text-emerald-500" size={18} />
      case 'PARTIAL': return <AlertTriangle className="text-amber-500" size={18} />
      case 'NON_COMPLIANT': return <XCircle className="text-rose-500" size={18} />
      default: return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck size={36} className="text-indigo-500" />
            Policy Evaluator
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Benchmark your company policies against global regulatory standards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Selection */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
          <div className="glass-card p-8 rounded-2xl border border-white/10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* File Upload */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">1. Upload Policy</label>
                <div 
                  className={cn(
                    "relative group h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
                    dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20 bg-white/5",
                    file ? "border-emerald-500/50 bg-emerald-500/5" : ""
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('policy-upload')?.click()}
                >
                  <input 
                    id="policy-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                  />
                  
                  {file ? (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <FileText size={32} className="text-emerald-400" />
                      </div>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">Ready for Analysis</p>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-500/20 transition-colors">
                        <Upload size={32} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-white">Select Policy Document</p>
                      <p className="text-xs text-slate-500 mt-1">PDF or Docx preferred</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Selection */}
              <div className="space-y-4 flex flex-col">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Select Compliances</label>
                <div className="flex-1 flex flex-col bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden min-h-[192px]">
                   <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
                      <Search size={14} className="text-slate-500" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-xs text-white placeholder:text-slate-600 w-full"
                        placeholder="Search frameworks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-40">
                      {filteredLaws.map((law, idx) => {
                        const isSelected = selectedLaws.some(l => l.payload?.section === law.payload?.section)
                        return (
                          <div 
                            key={idx}
                            onClick={() => toggleLaw(law)}
                            className={cn(
                              "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group",
                              isSelected ? "bg-indigo-600/20 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                            )}
                          >
                            <div className="flex-1 mr-2">
                              <p className={cn("text-xs font-bold leading-tight", isSelected ? "text-indigo-400" : "text-white")}>
                                {law.payload?.section}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{law.payload?.title}</p>
                            </div>
                            {isSelected ? <CheckCircle size={14} className="text-indigo-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 group-hover:border-slate-500 shrink-0" />}
                          </div>
                        )
                      })}
                   </div>
                   <div className="p-3 bg-indigo-500/5 border-t border-white/5">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        {selectedLaws.length} Compliances Selected
                      </p>
                   </div>
                </div>
              </div>
            </div>

            <Button 
                onClick={handleEvaluate} 
                className="w-full h-14 text-lg font-bold shadow-2xl shadow-indigo-500/20"
                isLoading={isUploading}
                disabled={!file || selectedLaws.length === 0}
            >
              Analyze Policy Compliance
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          {/* Detailed Results Section */}
          {selectedResult && (
            <div className="glass-card p-10 rounded-2xl border border-indigo-500/20 space-y-10 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{selectedResult.policyName}</h2>
                  <p className="text-slate-400">Analysis conducted on {new Date(selectedResult.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-5xl font-black text-indigo-500 leading-none">{selectedResult.complianceScore}%</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-3">Compliance Score</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck size={80} className="text-indigo-500" />
                </div>
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-3">Executive Summary</h3>
                <p className="text-slate-300 leading-relaxed relative z-10">{selectedResult.overallSummary}</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Detailed Gap Analysis</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(typeof selectedResult.detailedResults === 'string' ? JSON.parse(selectedResult.detailedResults) : selectedResult.detailedResults).map((item: any, idx: number) => (
                    <div key={idx} className="p-6 bg-slate-900 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <h4 className="font-bold text-white">{item.lawTitle}</h4>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                          item.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        )}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gap Analysis</p>
                          <p className="text-sm text-slate-400 leading-relaxed">{item.gapAnalysis}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Recommendation</p>
                          <p className="text-sm text-emerald-400/80 leading-relaxed">{item.recommendations}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-12 xl:col-span-4">
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-400" />
                <h2 className="font-bold text-white tracking-tight">Recent History</h2>
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{evaluations.length} total</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center p-20 opacity-30">
                  <Loader2 className="animate-spin" />
                </div>
              ) : evaluations.length === 0 ? (
                <div className="p-12 text-center text-slate-600">
                  <ShieldCheck size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">No evaluations yet</p>
                  <p className="text-xs mt-1">Uploaded policies will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {evaluations.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedResult(item)}
                      className={cn(
                        "p-6 cursor-pointer transition-all hover:bg-white/5 relative group",
                        selectedResult?.id === item.id ? "bg-indigo-500/5" : ""
                      )}
                    >
                      {selectedResult?.id === item.id && <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500" />}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-white truncate max-w-[150px]">{item.policyName}</p>
                        <span className="text-[10px] font-black text-indigo-400">{item.complianceScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
