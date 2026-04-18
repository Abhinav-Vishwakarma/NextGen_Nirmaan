'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getStatusColor, getStatusLabel, getScoreColor, formatRelativeTime } from '@/lib/utils'
import { User } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/documents')
      .then(res => setDocuments(res.documents || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8 stagger-children pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Documents</h1>
          <p className="text-sm text-slate-400">View and manage uploaded compliance documents.</p>
        </div>
        <a href="/upload" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
          + Upload File
        </a>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
            <tr>
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Uploaded By</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-48" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-16" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-6 w-24 rounded-full" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-8 mx-auto" /></td>
                  <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
                </tr>
              ))
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No documents found. Upload your first invoice.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/documents/${doc.id}`}
                >
                  <td className="px-6 py-4 font-medium text-white">{doc.fileName}</td>
                  <td className="px-6 py-4">
                    {doc.uploadedBy ? (
                      <div className="flex items-center gap-2 text-slate-300">
                        <User size={14} className="text-blue-400 opacity-70" />
                        <span>{doc.uploadedBy}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{doc.category}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-center font-bold ${getScoreColor(doc.complianceScore)}`}>
                    {doc.complianceScore ?? '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatRelativeTime(doc.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
