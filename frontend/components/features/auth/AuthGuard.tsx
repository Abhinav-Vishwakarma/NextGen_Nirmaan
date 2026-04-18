"use client"

import { useEffect, type JSX, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type AuthGuardProps = {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const { isReady, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/')}`)
    }
  }, [isReady, isAuthenticated, pathname, router])

  if (!isReady) {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center px-6">
        <p className="text-sm text-slate-600">Checking session...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center px-6">
        <p className="text-sm text-slate-600">Redirecting to login...</p>
      </main>
    )
  }

  return <>{children}</>
}
