import type { JSX } from 'react'

export default function Loading(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
    </main>
  )
}
