"use client"

import { useMemo, useState } from 'react'
import type { LogtoTokenPayload } from '@/types/auth.types'

type UseAuthResult = {
  token: string | null
  user: LogtoTokenPayload | null
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

export function useAuth(): UseAuthResult {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<LogtoTokenPayload | null>(null)

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  const login = (): void => {
    setToken('demo-token')
    setUser({
      sub: 'demo-user',
      email: 'user@example.com',
      name: 'Demo User',
      username: 'demo-user',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  }

  const logout = (): void => {
    setToken(null)
    setUser(null)
  }

  return { token, user, isAuthenticated, login, logout }
}
