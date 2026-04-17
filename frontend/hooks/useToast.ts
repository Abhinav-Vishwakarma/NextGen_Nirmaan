"use client"

import { useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

type ToastPayload = {
  title: string
  message?: string
  type?: ToastType
}

type UseToastResult = {
  showToast: (payload: ToastPayload) => void
}

export function useToast(): UseToastResult {
  const showToast = useCallback((payload: ToastPayload) => {
    const prefix = payload.type ? `[${payload.type.toUpperCase()}]` : '[INFO]'
    const message = payload.message ? ` ${payload.message}` : ''
    console.log(`${prefix} ${payload.title}${message}`)
  }, [])

  return { showToast }
}
