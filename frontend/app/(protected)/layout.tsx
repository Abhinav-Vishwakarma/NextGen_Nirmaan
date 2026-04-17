import type { JSX, ReactNode } from 'react'
import { AuthGuard } from '@/components/features/auth/AuthGuard'

type ProtectedLayoutProps = {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps): JSX.Element {
  return <AuthGuard>{children}</AuthGuard>
}
