import type { JSX } from 'react'
import { Card } from '@/components/ui'

export default function LoginPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <Card title="Login" description="Authentication flow placeholder.">
        <p className="text-sm text-slate-600">Wire this page to your Logto sign-in button.</p>
      </Card>
    </main>
  )
}
