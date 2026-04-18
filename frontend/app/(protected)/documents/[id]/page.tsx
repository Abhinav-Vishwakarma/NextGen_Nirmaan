'use client'

import { useEffect, useState, use, useMemo } from 'react'
import { api, API_BASE } from '@/lib/api'
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  User,
  LayoutDashboard,
  FileSpreadsheet,
  Activity,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ExcelViewer } from '@/components/ui/ExcelViewer/ExcelViewer'
import { Button } from '@/components/ui/Button'

function ScoreGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#6366f1' // Indigo default
  if (score >= 85) color = '#10b981' // Green
  else if (score >= 60) color = '#f59e0b' // Amber
  else color = '#ef4444' // Red

  return (
    <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="80" cy="80" r="45"
          stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="transparent"
        />
        <circle
          cx="80" cy="80" r="45"
          stroke={color} strokeWidth="10" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={score === 0 ? circumference : offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Compliance</span>
      </div>
    </div>
  )
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [autoRunTriggered, setAutoRunTriggered] = useState(false)
  const [activeTab, setActiveTab] = useState<'analysis' | 'data'>('analysis')
  const { showToast } = useToast()
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const autoRun = searchParams.get('autoRun') === 'true'

  useEffect(() => {
    fetchDoc()
  }, [])

  useEffect(() => {
    if (doc && autoRun && !autoRunTriggered && !verifying && (doc.status === 'EXTRACTED' || doc.status === 'UPLOADED')) {
      setAutoRunTriggered(true)
      handleVerify()
      router.replace(pathname, { scroll: false })
    }
  }, [doc, autoRun, autoRunTriggered, verifying])

  const fetchDoc = async () => {
    try {
      const target = await api.get(`/api/documents/${id}`)
      setDoc(target || null)
    } catch {
      showToast({ type: 'error', title: 'Connection Failure' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    showToast({ type: 'info', title: 'AI Audit Cycle Started', message: 'Analyzing patterns...' })
    try {
       const res = await api.post(`/api/documents/${id}/verify`, {})
       setDoc(res)
       showToast({
          type: res.status === 'VERIFIED' ? 'success' : 'warning',
          title: 'Audit Complete',
          message: `Document flagged with ${res.complianceScore}% confidence.`
       })
    } catch (e: any) {
       showToast({ type: 'error', title: 'Verification Reject' })
    } finally {
       setVerifying(false)
    }
  }

  const isSpreadsheet = useMemo(() => {
    if (!doc) return false
    const spreadsheetTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ]
    const ext = doc.fileName?.split('.').pop()?.toLowerCase()
    return spreadsheetTypes.includes(doc.fileType) || ['csv', 'xlsx', 'xls'].includes(ext)
  }, [doc])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Retrieving Artifact...</p>
    </div>
  )
  
  if (!doc) return <div className="p-20 text-center font-black uppercase tracking-widest text-rose-500">Record Not Found</div>

  const report = doc.complianceReport ? JSON.parse(doc.complianceReport) : null

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeInUp pb-24">
      <div className="mesh-bg" />
      
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div className="space-y-4">
            <Link 
                href={doc.projectId ? `/projects/${doc.projectId}` : "/projects"} 
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Workspace
            </Link>
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-white tracking-tighter">{doc.fileName}</h1>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={12} className="text-indigo-500" />
                        Status: <span className="text-indigo-400">{doc.status}</span>
                    </div>
                    {doc.uploadedBy && (
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} />
                            Owner: <span className="text-slate-400">{doc.uploadedBy}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {(doc.status === 'EXTRACTED' || doc.status === 'UPLOADED') && (
            <Button 
                onClick={handleVerify} 
                isLoading={verifying}
                size="lg"
                className="px-8"
                leftIcon={!verifying && <Sparkles size={18} />}
            >
                {verifying ? 'Auditing...' : 'Run AI Compliance'}
            </Button>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
        <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            <ShieldCheck size={14} />
            AI Analysis
        </button>
        {isSpreadsheet && (
            <button
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'data' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <FileSpreadsheet size={14} />
                Data Viewer
            </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'analysis' ? (
            <div className="space-y-8 animate-fadeInUp">
                {!report && !verifying && doc.status !== 'EXTRACTING' && doc.status !== 'VERIFYING' ? (
                     <div className="glass-panel p-20 text-center flex flex-col items-center gap-6">
                        <div className="p-6 bg-indigo-500/10 rounded-3xl text-indigo-500">
                             <Info size={48} className="opacity-50" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white tracking-tight">Pending Verification</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">This artifact has not been processed. Initiate the AI Audit cycle to generate a compliance report.</p>
                        </div>
                        <Button onClick={handleVerify} variant="secondary" leftIcon={<Sparkles size={16}/>}>Start Analysis</Button>
                     </div>
                  ) : report ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Summary */}
                      <div className="lg:col-span-4 space-y-8">
                        <div className="glass-panel p-10 text-center space-y-8">
                          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Audit Scoring</h2>
                          <ScoreGauge score={report.complianceScore || 0} />
                          
                          <div className="space-y-4">
                            {report.status === 'APPROVED' ? (
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Valid Record</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <ShieldAlert size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Check Required</span>
                              </div>
                            )}
                            <p className="text-sm font-medium text-slate-400 leading-relaxed px-4">
                              {report.summary}
                            </p>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {report.recommendations && report.recommendations.length > 0 && (
                            <div className="glass-panel p-8 space-y-4 border-indigo-500/20 bg-indigo-500/[0.02]">
                                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles size={14} /> Recommended Logic
                                </h2>
                                <ul className="space-y-4">
                                  {report.recommendations.map((rec: string, i: number) => (
                                     <li key={i} className="flex gap-4 text-xs text-slate-300 font-bold leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        {rec}
                                     </li>
                                  ))}
                                </ul>
                            </div>
                        )}
                      </div>

                      {/* Right Column: Reasoning */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="glass-panel p-10 space-y-8">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white tracking-tight">Verification Log</h2>
                            <div className="flex gap-2">
                                <span className="bg-slate-950 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">v1.2 AI Agent</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {(report.checks || []).map((check: any, i: number) => (
                              <div key={i} className="p-6 rounded-[2rem] bg-slate-950 border border-slate-900 flex flex-col gap-4 group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                        check.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                     }`}>
                                        {check.result === 'PASS' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                                     </div>
                                     <h3 className="text-sm font-black text-white uppercase tracking-tight">{check.step.replace(/_/g, ' ')}</h3>
                                   </div>
                                   <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                        check.result === 'PASS' ? 'text-emerald-400 bg-emerald-500/5' : 'text-amber-400 bg-amber-500/5'
                                   }`}>
                                     {check.result}
                                   </div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed pl-1">{check.detail}</p>
                                {check.lawRef && (
                                   <div className="flex items-center gap-2 mt-2 pt-4 border-t border-slate-900">
                                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Source:</span>
                                     <span className="text-[10px] font-bold text-slate-500">{check.lawRef}</span>
                                   </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
            </div>
        ) : (
            <div className="animate-fadeInUp">
                <ExcelViewer 
                    fileUrl={`${API_BASE}/api/files/${doc.filePath}`} 
                    fileName={doc.fileName} 
                />
            </div>
        )}
      </div>
    </div>
  )
}
