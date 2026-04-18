"use client"

import { useEffect, useMemo, useState } from 'react'
import type { LogtoTokenPayload } from '@/types/auth.types'

const MOCK_AUTH_TOKEN_KEY = 'mock_auth_token'
const MOCK_AUTH_USER_KEY = 'mock_auth_user'

type UseAuthResult = {
  token: string | null
  user: LogtoTokenPayload | null
  isReady: boolean
  isAuthenticated: boolean
  login: (provider?: 'google' | 'microsoft' | 'sso') => void
  logout: () => void
}

export function useAuth(): UseAuthResult {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<LogtoTokenPayload | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const savedToken = window.localStorage.getItem(MOCK_AUTH_TOKEN_KEY)
    const savedUser = window.localStorage.getItem(MOCK_AUTH_USER_KEY)

    if (savedToken) {
      setToken(savedToken)
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as LogtoTokenPayload)
      } catch {
        window.localStorage.removeItem(MOCK_AUTH_USER_KEY)
      }
    }

    setIsReady(true)
  }, [])

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  const login = (provider: 'google' | 'microsoft' | 'sso' = 'sso'): void => {
    const authToken = `mock-${provider}-token`
    const authUser: LogtoTokenPayload = {
      sub: 'demo-user',
      email: 'demo.user@example.com',
      name: 'Demo User',
      username: 'demo-user',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    }

    setToken(authToken)
    setUser(authUser)
    window.localStorage.setItem(MOCK_AUTH_TOKEN_KEY, authToken)
    window.localStorage.setItem(MOCK_AUTH_USER_KEY, JSON.stringify(authUser))
  }

  const logout = (): void => {
    setToken(null)
    setUser(null)
    window.localStorage.removeItem(MOCK_AUTH_TOKEN_KEY)
    window.localStorage.removeItem(MOCK_AUTH_USER_KEY)
  }

  return { token, user, isReady, isAuthenticated, login, logout }
}
