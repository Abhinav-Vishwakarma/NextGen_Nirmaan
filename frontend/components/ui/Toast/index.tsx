'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'


export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastPayload = {
  title: string
  message?: string
  type?: ToastType
  duration?: number // ms, default 4000
}

type ToastItem = ToastPayload & {
  id: number
  exiting: boolean
}

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void
}


export const ToastContext = createContext<ToastContextValue | null>(null)


const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />,
  error:   <XCircle     size={18} className="shrink-0 text-red-400" />,
  warning: <AlertTriangle size={18} className="shrink-0 text-amber-400" />,
  info:    <Info         size={18} className="shrink-0 text-blue-400" />,
}

const BORDER: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
}

const GLOW: Record<ToastType, string> = {
  success: 'shadow-emerald-900/30',
  error:   'shadow-red-900/30',
  warning: 'shadow-amber-900/30',
  info:    'shadow-blue-900/30',
}


export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 350)
  }, [])

  const showToast = useCallback((payload: ToastPayload) => {
    const id = ++counterRef.current
    const duration = payload.duration ?? 4000

    setToasts(prev => [...prev, { ...payload, type: payload.type ?? 'info', id, exiting: false }])

    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-3rem)] pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            style={{
              animation: toast.exiting
                ? 'toastOut 0.35s ease-in forwards'
                : 'toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
            className={[
              'pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl',
              'bg-[#1a1a28] border border-white/10 border-l-4',
              'shadow-xl backdrop-blur-md',
              BORDER[toast.type ?? 'info'],
              GLOW[toast.type ?? 'info'],
            ].join(' ')}
          >
            {/* Icon */}
            <span className="mt-0.5">{ICONS[toast.type ?? 'info']}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}


export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
