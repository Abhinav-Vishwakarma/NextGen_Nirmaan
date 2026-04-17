import type { JSX } from 'react'

export default function AuthCallbackPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Signing you in...</h1>
      <p className="mt-2 text-sm text-slate-600">Handling authentication callback.</p>
    </main>
  )
}
