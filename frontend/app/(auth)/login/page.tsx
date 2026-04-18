"use client"

import { useMemo, useState, type FormEvent, type JSX } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Building2, Globe, Mail, Shield, UserCircle2 } from 'lucide-react'

type Provider = 'google' | 'microsoft' | 'sso'

const PROVIDER_LABEL: Record<Provider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  sso: 'SSO',
}

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const nextPath = useMemo(() => searchParams.get('next') ?? '/dashboard', [searchParams])

  const handleMockLogin = (provider: Provider): void => {
    setError(null)
    setIsLoading(provider)
    login(provider)

    window.setTimeout(() => {
      router.push(nextPath)
    }, 550)
  }

  const handleEmailPasswordLogin = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    handleMockLogin('sso')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.22),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.12),transparent_40%)]" />

      <section className="relative w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#0d111a]/80 p-6 backdrop-blur-xl shadow-[0_32px_80px_-32px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="mb-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
            <Shield size={14} />
            Secure Access
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your compliance command center.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleEmailPasswordLogin}>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            label="Email Address"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={Boolean(isLoading)}
          />

          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={Boolean(isLoading)}
          />

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={Boolean(isLoading)}
            isLoading={isLoading === 'sso'}
            leftIcon={<Mail size={16} />}
          >
            Continue with Email and Password
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full border border-white/10 bg-[#121a2a] text-slate-100 hover:bg-[#16213a]"
            disabled={Boolean(isLoading)}
            isLoading={isLoading === 'google'}
            leftIcon={<Globe size={16} />}
            onClick={() => handleMockLogin('google')}
          >
            {`Sign in with ${PROVIDER_LABEL.google}`}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full border border-white/10 bg-[#121a2a] text-slate-100 hover:bg-[#16213a]"
            disabled={Boolean(isLoading)}
            isLoading={isLoading === 'microsoft'}
            leftIcon={<Building2 size={16} />}
            onClick={() => handleMockLogin('microsoft')}
          >
            {`Sign in with ${PROVIDER_LABEL.microsoft}`}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full border border-slate-700/80 text-slate-300 hover:bg-slate-800/60"
            disabled={Boolean(isLoading)}
            isLoading={isLoading === 'sso'}
            leftIcon={<UserCircle2 size={16} />}
            onClick={() => handleMockLogin('sso')}
          >
            Continue with Company SSO
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Mock sign-in for demo only.
        </p>
      </section>
    </main>
  )
}
