import type { JSX } from 'react'
import Link from 'next/link'

export default function NotFoundPage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">The page you are looking for does not exist.</p>
      <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
        Back to home
      </Link>
    </main>
  )
}
