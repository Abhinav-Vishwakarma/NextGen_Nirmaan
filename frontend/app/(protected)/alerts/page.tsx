'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, AlertOctagon, Info, ChevronRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/api/alerts')
      setAlerts(res.alerts || [])
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    // Note: To fully implement this, you'd need a PUT /api/alerts/:id/read endpoint on the backend
    // For now we'll do an optimistic UI update so the user feels the interactivity
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading alerts...</div>
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8 stagger-children animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">System Alerts</h1>
        <p className="text-sm text-slate-400">Review compliance issues and system notifications.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50 text-emerald-400" />
          <p>No alerts found. You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`glass-card p-6 flex flex-col sm:flex-row gap-4 transition-all ${
                alert.isRead ? 'opacity-50 bg-white/5 border-l-4 border-l-transparent' : 'bg-[#12121a] border-l-4 border-l-amber-500 shadow-lg shadow-amber-900/10'
              }`}
            >
              <div className="shrink-0 mt-1">
                {alert.severity === 'critical' ? (
                  <AlertOctagon className="text-red-500" size={24} />
                ) : alert.severity === 'warning' ? (
                  <AlertTriangle className="text-amber-500" size={24} />
                ) : (
                  <Info className="text-blue-500" size={24} />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${alert.isRead ? 'text-slate-300' : 'text-white'}`}>
                    {alert.title}
                  </h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {formatDate(alert.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{alert.message}</p>
                
                <div className="flex items-center gap-4">
                  {alert.relatedDocId && (
                    <Link 
                      href={`/documents/${alert.relatedDocId}`}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      View Document <ChevronRight size={14} />
                    </Link>
                  )}
                  
                  {!alert.isRead && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
