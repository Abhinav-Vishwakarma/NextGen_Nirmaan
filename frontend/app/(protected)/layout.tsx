import type { JSX, ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Upload, FileText, Bell, Scale, Activity } from 'lucide-react'
import { ToastProvider } from '@/components/ui/Toast'

type ProtectedLayoutProps = {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps): JSX.Element {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#0a0a0f] text-[#f0f0f5]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#ffffff14] bg-[#12121a] flex flex-col hidden md:flex">
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-white">NextGen Nirmaan</h1>
            <p className="text-xs text-slate-400 mt-1">Compliance Agent</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <LayoutDashboard size={18} className="text-slate-400" />
              Dashboard
            </Link>
            <Link href="/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <Upload size={18} className="text-slate-400" />
              Upload
            </Link>
            <Link href="/documents" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <FileText size={18} className="text-slate-400" />
              Documents
            </Link>
            <Link href="/alerts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <Bell size={18} className="text-slate-400" />
              Alerts
            </Link>
            <Link href="/law-intel" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <Scale size={18} className="text-slate-400" />
              Law Intel
            </Link>
            <Link href="/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <Activity size={18} className="text-slate-400" />
              Audit Logs
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-[#ffffff14] bg-[#0a0a0f] flex items-center px-8 shrink-0">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                AD
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
