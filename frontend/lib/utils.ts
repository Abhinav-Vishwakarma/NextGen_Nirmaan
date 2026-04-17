import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '--'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export type DocumentStatus =
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'FLAGGED'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export function getStatusColor(status: DocumentStatus | string): string {
  const map: Record<string, string> = {
    UPLOADED: 'badge-gray',
    EXTRACTING: 'badge-blue',
    EXTRACTED: 'badge-amber',
    VERIFYING: 'badge-blue',
    VERIFIED: 'badge-green',
    FLAGGED: 'badge-red',
  }
  return map[status] ?? 'badge-gray'
}

export function getStatusLabel(status: DocumentStatus | string): string {
  const map: Record<string, string> = {
    UPLOADED: 'Uploaded',
    EXTRACTING: 'Extracting...',
    EXTRACTED: 'Extracted',
    VERIFYING: 'Verifying...',
    VERIFIED: 'Verified',
    FLAGGED: 'Flagged',
  }
  return map[status] ?? status
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-slate-400'
  if (score >= 85) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export function getSeverityColor(severity: AlertSeverity | string): string {
  const map: Record<string, string> = {
    critical: 'text-red-400 border-red-500/30 bg-red-500/5',
    warning: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  }
  return map[severity] ?? map.info
}

export function getSeverityIcon(severity: AlertSeverity | string): string {
  const map: Record<string, string> = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  }
  return map[severity] ?? '🔵'
}
