"use client"

import type { JSX } from 'react'
import { Button } from '@/components/ui/Button'
import type { ModalProps } from './Modal.types'

export function Modal({ isOpen, title, onClose, children }: ModalProps): JSX.Element | null {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-100">{title ?? 'Dialog'}</h3>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
