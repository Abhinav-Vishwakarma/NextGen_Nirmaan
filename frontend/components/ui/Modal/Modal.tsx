"use client"

import type { JSX } from 'react'
import { Button } from '@/components/ui/Button'
import type { ModalProps } from './Modal.types'

export function Modal({ isOpen, title, onClose, children }: ModalProps): JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{title ?? 'Dialog'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
