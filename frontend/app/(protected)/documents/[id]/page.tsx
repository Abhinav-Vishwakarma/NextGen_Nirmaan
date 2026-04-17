'use client'

import { useEffect, useState, use } from 'react'
import { api } from '@/lib/api'
import { ArrowLeft, CheckCircle, AlertTriangle, Info, ShieldCheck } from 'lucide-react'

// SVG Gauge Component
function ScoreGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#3b82f6' // Blue default (not evaluated)
  if (score >= 85) color = '#10b981' // Green
  else if (score >= 60) color = '#f59e0b' // Amber
  else color = '#ef4444' // Red

  return (
    <div className="relative w-32 h-32 flex items-center justify-center mx-auto">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="64" cy="64" r="45"
          stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx="64" cy="64" r="45"
          stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={score === 0 ? circumference : offset} // animate to offset later
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white shadow-sm" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Score</span>
      </div>
    </div>
  )
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetchDoc()
  }, [])

  const fetchDoc = async () => {
    try {
      const res = await api.get('/api/documents')
      const target = res.documents.find((d: any) => d.id === id)
      setDoc(target || null)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
       const res = await api.post(`/api/documents/${id}/verify`, {})
       setDoc(res) // API should return updated doc with complianceReport
    } catch (e) {
       console.error("Verification failed", e)
       alert("Verification failed.")
    } finally {
       setVerifying(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading document...</div>
  
  if (!doc) return <div className="p-8 text-center text-red-400">Document not found on this proxy layer.</div>

  const report = doc.complianceReport ? JSON.parse(doc.complianceReport) : null

  return (
    <div className="max-w-5xl mx-auto stagger-children pb-16">
      <div className="mb-6">
        <a href="/documents" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm w-fit transition-colors">
          <ArrowLeft size={16} /> Back to Documents
        </a>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{doc.fileName}</h1>
          <p className="text-slate-400 text-sm">Status: 
              <span className="px-2 py-1 mx-2 bg-white/10 rounded-md text-white">{doc.status}</span>
          </p>
        </div>
        
        {(doc.status === 'EXTRACTED' || doc.status === 'UPLOADED') && (
          <button 
             onClick={handleVerify} 
             disabled={verifying}
             className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            {verifying ? (
               <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Running AI Engine...</>
            ) : (
               <><ShieldCheck size={18} /> Run AI Compliance Check</>
            )}
          </button>
        )}
      </div>

      {!report && !verifying && doc.status !== 'EXTRACTING' && doc.status !== 'VERIFYING' && (
         <div className="glass-card p-12 text-center text-slate-400">
             <Info size={48} className="mx-auto mb-4 opacity-50 text-blue-400" />
             <p>This document has not been verified by the AI Agent yet.</p>
             <p className="text-sm mt-2 opacity-70">Click the button above to run the Plan-Execute-Verify loop.</p>
         </div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Column: Score */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 text-center pt-8">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">AI Compliance Score</h2>
              <ScoreGauge score={report.complianceScore || 0} />
              
              <div className="mt-8">
                {report.status === 'APPROVED' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle size={16} />
                    <span className="font-semibold">Compliance Passed</span>
                  </div>
                ) : report.status === 'FLAGGED' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertTriangle size={16} />
                    <span className="font-semibold">Action Required</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Info size={16} />
                    <span className="font-semibold">Needs Review</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-6 leading-relaxed">
                {report.summary}
              </p>
            </div>
          </div>

          {/* Right Column: Check Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Reasoning & Verification</h2>
              <div className="space-y-4">
                {(report.checks || []).map((check: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-medium text-white flex items-center gap-2">
                         {check.result === 'PASS' && <CheckCircle size={16} className="text-emerald-400" />}
                         {check.result === 'FAIL' && <AlertTriangle size={16} className="text-red-400" />}
                         {check.result === 'WARN' && <AlertTriangle size={16} className="text-amber-400" />}
                         {check.step.replace(/_/g, ' ')}
                       </h3>
                       <span className={`text-xs font-bold px-2 py-1 rounded bg-white/10 ${check.result === 'PASS' ? 'text-emerald-400' : check.result === 'FAIL' ? 'text-red-400' : 'text-amber-400'}`}>
                         {check.result}
                       </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{check.detail}</p>
                    {check.lawRef && (
                       <p className="text-xs text-blue-400 mt-3 pt-3 border-t border-white/5 inline-block">
                         Ref: {check.lawRef}
                       </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
                <div className="glass-card p-6 bg-gradient-to-br from-[#12121a] to-blue-900/10 border-blue-500/20">
                    <h2 className="text-lg font-semibold text-white mb-4">Recommended Actions</h2>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec: string, i: number) => (
                         <li key={i} className="flex gap-3 text-sm text-slate-300">
                            <span className="text-blue-400 mt-0.5">•</span>
                            {rec}
                         </li>
                      ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
