'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useCountUp } from '@/hooks/useCountUp'
import { FileText, ShieldCheck, AlertTriangle, Bell, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { getStatusColor, getStatusLabel, getScoreColor, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

function StatCard({ title, value, icon: Icon, colorClass, gradientClass, delay }: any) {
  const animatedValue = useCountUp(value, 1500)
  
  return (
    <div className={`glass-card p-6 overflow-hidden relative ${colorClass}`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 ${gradientClass}`} />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{animatedValue}</h3>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <Icon size={20} className="opacity-80" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
     return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>
  }
  
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard</div>

  const { stats, recentDocuments, recentAlerts, trendData } = data

  return (
    <div className="max-w-7xl mx-auto space-y-8 stagger-children pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Command Center</h1>
          <p className="text-slate-400">Overview of your compliance posture and AI processing.</p>
        </div>
        <div className="text-sm text-slate-500">
           Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
           delay={0}
           title="Total Documents" 
           value={stats.totalDocuments} 
           icon={FileText} 
           colorClass="hover:border-blue-500/30"
           gradientClass="bg-blue-500"
        />
        <StatCard 
           delay={100}
           title="Average Compliance" 
           value={stats.averageScore} 
           icon={ShieldCheck} 
           colorClass="hover:border-emerald-500/30"
           gradientClass="bg-emerald-500"
        />
        <StatCard 
           delay={200}
           title="Flagged Documents" 
           value={stats.flaggedCount} 
           icon={AlertTriangle} 
           colorClass="hover:border-red-500/30"
           gradientClass="bg-red-500"
        />
        <StatCard 
           delay={300}
           title="Active Alerts" 
           value={stats.unreadAlerts} 
           icon={Bell} 
           colorClass="hover:border-amber-500/30"
           gradientClass="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-6 h-[400px]">
              <h2 className="text-lg font-semibold text-white mb-6">Compliance Trend</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#8b8b9e" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis yAxisId="left" stroke="#8b8b9e" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b8b9e" fontSize={12} tickLine={false} axisLine={false} dx={10} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#12121a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                       itemStyle={{ color: '#fff' }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Avg Score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="processed" name="Processed Docs" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Recent Documents Table */}
           <div className="glass-card overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                   <h2 className="text-lg font-semibold text-white">Recent Processing</h2>
                   <Link href="/documents" className="text-sm text-blue-400 hover:text-blue-300">View All</Link>
               </div>
               <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-slate-400 font-medium">
                     <tr>
                        <th className="px-6 py-3">Document</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Score</th>
                        <th className="px-6 py-3">Time</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {recentDocuments.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center">No documents processed yet.</td></tr>
                     )}
                     {recentDocuments.map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-white/5 cursor-pointer transition-colors" onClick={() => window.location.href = `/documents/${doc.id}`}>
                           <td className="px-6 py-3 font-medium text-white">{doc.fileName}</td>
                           <td className="px-6 py-3">
                              <span className={`badge ${getStatusColor(doc.status)} scale-90 origin-left`}>{getStatusLabel(doc.status)}</span>
                           </td>
                           <td className={`px-6 py-3 text-center font-bold ${getScoreColor(doc.complianceScore)}`}>
                              {doc.complianceScore ?? '--'}
                           </td>
                           <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{formatRelativeTime(doc.createdAt)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
           </div>
        </div>

        {/* Alerts Sidebar */}
        <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white px-2">Active Alerts</h2>
            
            {recentAlerts.length === 0 ? (
               <div className="glass-card p-6 text-center text-slate-500">
                  <CheckCircle size={32} className="mx-auto mb-3 opacity-20" />
                  <p>All clear. No active alerts.</p>
               </div>
            ) : (
               recentAlerts.map((alert: any, i: number) => {
                  let border = 'border-blue-500/20'
                  let iconColor = 'text-blue-400'
                  let bg = 'bg-blue-500/5'
                  
                  if (alert.severity === 'critical') {
                     border = 'border-red-500/30'
                     iconColor = 'text-red-400'
                     bg = 'bg-red-500/5'
                  } else if (alert.severity === 'warning') {
                     border = 'border-amber-500/30'
                     iconColor = 'text-amber-400'
                     bg = 'bg-amber-500/5'
                  }

                  return (
                      <Link 
                      href={`/documents/${alert.relatedDocId}`}
                      key={alert.id}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                     <div  key={alert.id} className={`glass-card p-5 ${border} ${bg} relative group`} style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex gap-4">
                           <div className={`mt-1 ${iconColor}`}>
                              {alert.severity === 'critical' ? <AlertTriangle size={20} /> : <Bell size={20} />}
                           </div>
                           <div>
                              <h4 className="text-sm font-medium text-white mb-1">{alert.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">{alert.message}</p>
                              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                                 <span>{formatRelativeTime(alert.createdAt)}</span>
                                 {alert.type === 'DEADLINE' && <span className="text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10">Deadline</span>}
                              </div>
                           </div>
                        </div>
                     </div>
                     </Link>
                  )
               })
            )}
            
            <Link href="/alerts" className="block text-center text-sm text-slate-400 hover:text-white py-2 transition-colors">
               View all alerts →
            </Link>
        </div>
      </div>
    </div>
  )
}
