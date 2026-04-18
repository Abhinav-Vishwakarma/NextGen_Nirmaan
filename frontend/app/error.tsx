"use client"

import { useEffect, type JSX } from 'react'
import { Button } from '@/components/ui'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps): JSX.Element {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-semibold text-slate-100">Something went wrong</h2>
      <p className="text-sm text-slate-400">Please try again or refresh the page.</p>
      <Button onClick={reset}>Try Again</Button>
    </main>
  )
}
