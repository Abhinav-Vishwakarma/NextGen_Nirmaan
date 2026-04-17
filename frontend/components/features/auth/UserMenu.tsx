"use client"

import type { JSX } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

export function UserMenu(): JSX.Element {
  const { user, logout } = useAuth()

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-700">{user?.name ?? 'Guest'}</span>
      <Button variant="secondary" size="sm" onClick={logout}>
        Logout
      </Button>
    </div>
  )
}
