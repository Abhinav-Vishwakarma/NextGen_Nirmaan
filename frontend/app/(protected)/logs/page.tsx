'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Activity, Clock, User, FileText, CheckCircle, ShieldCheck, Search, Filter } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  useEffect(() => {
    api.get('/api/logs')
      .then(res => setLogs(res.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'DOCUMENT_UPLOADED':
        return <FileText size={16} className="text-blue-400" />
      case 'AI_CHECK_RUN':
        return <ShieldCheck size={16} className="text-emerald-400" />
      default:
        return <Activity size={16} className="text-slate-400" />
    }
  }

  const formatEventLabel = (eventType: string) => {
    return eventType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
  }

  const parseDetails = (detailsString: string | null) => {
    if (!detailsString) return null
    try {
      return JSON.parse(detailsString)
    } catch {
      return null
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesType = selectedType === 'ALL' || log.eventType === selectedType
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      log.username.toLowerCase().includes(searchLower) ||
      log.eventType.toLowerCase().includes(searchLower) ||
      (log.details && log.details.toLowerCase().includes(searchLower))
    
    return matchesType && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto stagger-children pb-16">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity size={24} className="text-blue-500" />
            Audit Logs
          </h1>
          <p className="text-slate-400">Track system events, user actions, and compliance checks.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none w-full sm:w-auto cursor-pointer"
            >
              <option value="ALL" className="bg-[#12121a]">All Events</option>
              <option value="DOCUMENT_UPLOADED" className="bg-[#12121a]">Document Uploads</option>
              <option value="AI_CHECK_RUN" className="bg-[#12121a]">AI Checks</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-32" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-48" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <Activity size={48} className="mx-auto mb-4 opacity-20" />
                  No system logs found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const details = parseDetails(log.details)
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-white">
                        {getEventIcon(log.eventType)}
                        {formatEventLabel(log.eventType)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-blue-400 opacity-70" />
                        <span className={log.username === 'System' ? 'text-slate-500 italic' : ''}>
                          {log.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {details ? (
                        <div className="text-slate-400">
                          {details.fileName && <span className="text-slate-300 font-medium">{details.fileName}</span>}
                          {details.score !== undefined && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-white/10">
                              Score: {details.score}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No details available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} className="opacity-50" />
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
