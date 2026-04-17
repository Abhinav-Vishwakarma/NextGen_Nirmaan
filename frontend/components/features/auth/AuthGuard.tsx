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
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/')}`)
    }
  }, [isAuthenticated, pathname, router])

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center px-6">
        <p className="text-sm text-slate-600">Redirecting to login...</p>
      </main>
    )
  }

  return <>{children}</>
}
